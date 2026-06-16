"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchApi } from "@/lib/api";
import { PUBLIC_CONFIG } from "@/lib/config/public";

const GOOGLE_SCRIPT_ID = "google-identity-services";
const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

function loadGoogleScript() {
  if (typeof window === "undefined") return Promise.reject(new Error("Browser required"));
  if (window.google?.accounts?.id) return Promise.resolve();

  const existingScript = document.getElementById(GOOGLE_SCRIPT_ID);
  if (existingScript) {
    if (existingScript.dataset.loaded === "true") {
      return window.google?.accounts?.id
        ? Promise.resolve()
        : Promise.reject(new Error("Google sign-in could not load."));
    }

    return new Promise((resolve, reject) => {
      existingScript.addEventListener("load", () => {
        existingScript.dataset.loaded = "true";
        resolve();
      }, { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Google sign-in could not load.")), { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error("Google sign-in could not load."));
    document.head.appendChild(script);
  });
}

export default function GoogleSignInButton({ mode = "signin", disabled = false, onAuthenticated, onProfileRequired, onError }) {
  const buttonRef = useRef(null);
  const nonceRef = useRef("");
  const submittingRef = useRef(false);
  const disabledRef = useRef(disabled);
  const onAuthenticatedRef = useRef(onAuthenticated);
  const onProfileRequiredRef = useRef(onProfileRequired);
  const onErrorRef = useRef(onError);
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  useEffect(() => {
    onAuthenticatedRef.current = onAuthenticated;
    onProfileRequiredRef.current = onProfileRequired;
    onErrorRef.current = onError;
  }, [onAuthenticated, onProfileRequired, onError]);

  const reportError = useCallback((message) => {
    setStatus(message);
    if (onErrorRef.current) onErrorRef.current(message);
  }, []);

  const handleCredential = useCallback(async (credentialResponse) => {
    if (disabledRef.current || submittingRef.current) return;
    const credential = credentialResponse?.credential;
    const nonce = nonceRef.current;

    if (!credential || !nonce) {
      reportError("Google sign-in was not completed. Please try again.");
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setStatus("");

    try {
      const response = await fetchApi("/auth/google", {
        method: "POST",
        body: JSON.stringify({ credential, nonce }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        reportError(data.message || "Google sign-in failed.");
        return;
      }

      if (data.requiresProfile) {
        if (onProfileRequiredRef.current) onProfileRequiredRef.current(data.googleProfile || null);
        return;
      }

      if (onAuthenticatedRef.current) onAuthenticatedRef.current(data);
    } catch {
      reportError("Google sign-in failed. Please try again.");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [reportError]);

  useEffect(() => {
    let active = true;

    async function renderButton() {
      if (!PUBLIC_CONFIG.googleClientId) {
        setStatus("Google sign-in is not configured.");
        return;
      }

      try {
        const nonceResponse = await fetchApi("/auth/google/nonce", { method: "GET" });
        const nonceData = await nonceResponse.json();

        if (!nonceResponse.ok || !nonceData.success || !nonceData.nonce) {
          throw new Error(nonceData.message || "Could not start Google sign-in.");
        }

        await loadGoogleScript();
        if (!active || !buttonRef.current) return;

        nonceRef.current = nonceData.nonce;
        buttonRef.current.innerHTML = "";

        window.google.accounts.id.initialize({
          client_id: PUBLIC_CONFIG.googleClientId,
          callback: handleCredential,
          nonce: nonceData.nonce,
          ux_mode: "popup",
        });

        window.google.accounts.id.renderButton(buttonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: mode === "signup" ? "signup_with" : "signin_with",
          shape: "rectangular",
          logo_alignment: "left",
          width: Math.min(buttonRef.current.offsetWidth || 400, 400),
        });
      } catch (error) {
        if (active) reportError(error.message || "Google sign-in could not start.");
      }
    }

    const renderTimer = window.setTimeout(renderButton, 0);

    return () => {
      active = false;
      window.clearTimeout(renderTimer);
    };
  }, [handleCredential, mode, reportError]);

  return (
    <div className="google-signin">
      <div className={disabled || submitting ? "google-signin-button disabled" : "google-signin-button"} ref={buttonRef} aria-live="polite" />
      {status && <p className="google-signin-message">{status}</p>}
    </div>
  );
}
