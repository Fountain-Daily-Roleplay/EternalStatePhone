(() => {
  const nativeCef = window.cef;
  if (!nativeCef || typeof nativeCef.emit !== 'function' || typeof nativeCef.on !== 'function') return;

  const nativeEmit = nativeCef.emit.bind(nativeCef);
  const nativeOn = nativeCef.on.bind(nativeCef);
  const bridgeEvent = '__sdphone_bridge';
  const listeners = new Map();
  const maxPayloadLength = 4000;

  function reportError(message, error) {
    console.error('[SDPhone CEF bridge] ' + message, error || '');
    window.dispatchEvent(new CustomEvent('sdphone:bridge:error', { detail: { message } }));
  }

  function decodePayload(value) {
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(decodeURIComponent(value));
    } catch (error) {
      reportError('Server mengirim payload yang tidak valid.', error);
      return null;
    }
  }

  nativeOn(bridgeEvent, (eventName, encodedPayload, ...identityArgs) => {
    const name = String(eventName || '');
    const callbacks = listeners.get(name);
    if (!callbacks) return;

    let detail;
    if (name === 'sdphone:player:identity') {
      detail = {
        playerId: Number(encodedPayload),
        accountName: String(identityArgs[0] || ''),
        displayName: String(identityArgs[1] || ''),
        authenticated: Number(identityArgs[2]) === 1
      };
    } else {
      detail = decodePayload(encodedPayload);
    }

    callbacks.forEach(callback => callback(detail));
  });

  nativeCef.emit = (eventName, detail) => {
    let encodedPayload;
    try {
      encodedPayload = encodeURIComponent(JSON.stringify(detail === undefined ? null : detail));
    } catch (error) {
      reportError('Payload event tidak dapat dienkode.', error);
      return false;
    }
    if (encodedPayload.length > maxPayloadLength) {
      reportError('Payload event melebihi batas 4 KB; gunakan upload terpisah untuk file media.');
      return false;
    }
    return nativeEmit(bridgeEvent, String(eventName), encodedPayload);
  };

  nativeCef.on = (eventName, callback) => {
    if (typeof callback !== 'function') return false;
    const name = String(eventName);
    let callbacks = listeners.get(name);
    if (!callbacks) {
      callbacks = new Set();
      listeners.set(name, callbacks);
    }
    callbacks.add(callback);
    return true;
  };
})();
