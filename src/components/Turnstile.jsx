// src/components/Turnstile.jsx
import React, { useEffect, useRef } from 'react';

const TURNSTILE_SITE_KEY = '0x4AAAAAADWtJVafyNps0ZGt';

export default function Turnstile({ onVerify, onExpire }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);

  // Store latest callbacks in refs to prevent unnecessary useEffect triggers
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onVerifyRef.current = onVerify;
    onExpireRef.current = onExpire;
  });

  useEffect(() => {
    let isMounted = true;
    let intervalId = null;

    const renderWidget = () => {
      if (!isMounted || !containerRef.current || !window.turnstile) return;

      if (widgetIdRef.current !== null) {
        try {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        } catch (e) {
          // ignore cleanup error
        }
      }

      containerRef.current.innerHTML = '';

      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: 'dark',
          callback: (token) => {
            if (isMounted && onVerifyRef.current) onVerifyRef.current(token);
          },
          'expired-callback': () => {
            if (isMounted && onExpireRef.current) onExpireRef.current();
          },
          'error-callback': () => {
            if (isMounted && onExpireRef.current) onExpireRef.current();
          }
        });
      } catch (err) {
        console.error('Turnstile render error:', err);
      }
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      intervalId = setInterval(() => {
        if (window.turnstile) {
          clearInterval(intervalId);
          renderWidget();
        }
      }, 100);
    }

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
      if (window.turnstile && widgetIdRef.current !== null) {
        try {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        } catch (e) {
          // ignore
        }
      }
    };
  }, []); // Mounted strictly once

  return (
    <div 
      ref={containerRef} 
      style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        margin: '1rem 0',
        minHeight: '65px' 
      }} 
    />
  );
}