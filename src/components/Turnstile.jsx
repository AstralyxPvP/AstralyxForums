// src/components/Turnstile.jsx
import React, { useEffect, useRef } from 'react';

const TURNSTILE_SITE_KEY = '0x4AAAAAADWtJVafyNps0ZGt';

const Turnstile = ({ onVerify, onExpire }) => {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);

  useEffect(() => {
    let timeoutId;

    const renderTurnstile = () => {
      if (window.turnstile && containerRef.current) {
        // Clean up existing widget if re-rendering
        if (widgetIdRef.current !== null) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch (e) {
            // ignore
          }
        }

        containerRef.current.innerHTML = '';

        // Render widget explicitly
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (token) => {
            if (onVerify) onVerify(token);
          },
          'expired-callback': () => {
            if (onExpire) onExpire();
          },
          'error-callback': () => {
            if (onExpire) onExpire();
          }
        });
      } else {
        // Retry shortly if Turnstile JS hasn't loaded yet
        timeoutId = setTimeout(renderTurnstile, 150);
      }
    };

    renderTurnstile();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (window.turnstile && widgetIdRef.current !== null) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  return <div ref={containerRef} style={{ marginBottom: '1rem' }} />;
};

export default Turnstile;
