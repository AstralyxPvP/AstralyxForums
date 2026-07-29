import React, { useEffect, useRef } from 'react';

// Your Cloudflare Turnstile Site Key
export const TURNSTILE_SITE_KEY = '0x4AAAAAADWtJVafyNps0ZGt';

export const Turnstile = ({ onSuccess, onError, onExpire }) => {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);

  useEffect(() => {
    const renderWidget = () => {
      if (window.turnstile && containerRef.current && widgetIdRef.current === null) {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: 'dark',
          callback: (token) => onSuccess?.(token),
          'error-callback': () => onError?.(),
          'expired-callback': () => onExpire?.()
        });
      }
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      const existingScript = document.getElementById('cf-turnstile-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'cf-turnstile-script';
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.onload = renderWidget;
        document.head.appendChild(script);
      } else {
        existingScript.addEventListener('load', renderWidget);
      }
    }

    return () => {
      if (widgetIdRef.current !== null && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [onSuccess, onError, onExpire]);

  return <div ref={containerRef} style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }} />;
};

export default Turnstile;
