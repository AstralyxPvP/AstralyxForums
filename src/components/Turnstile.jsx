// src/components/Turnstile.jsx
import React, { useEffect, useRef } from 'react';

const TURNSTILE_SITE_KEY = '0x4AAAAAADWtJVafyNps0ZGt';

export default function Turnstile({ onVerify, onExpire }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    let intervalId = null;

    const renderWidget = () => {
      if (!isMounted || !containerRef.current || !window.turnstile) return;

      // Clean up previous widget instance if tab switched
      if (widgetIdRef.current !== null) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {
          // ignore
        }
      }

      containerRef.current.innerHTML = '';

      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: 'dark', // Matches dark mode UI
          callback: (token) => {
            if (isMounted && onVerify) onVerify(token);
          },
          'expired-callback': () => {
            if (isMounted && onExpire) onExpire();
          },
          'error-callback': () => {
            if (isMounted && onExpire) onExpire();
          }
        });
      } catch (err) {
        console.error('Turnstile render error:', err);
      }
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      // Poll every 100ms until Cloudflare script is ready
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
        } catch (e) {
          // ignore
        }
      }
    };
  }, [onVerify, onExpire]);

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
