// ==UserScript==
// @name         MYM - Stock Tecnico desde Scord cada 5 minutos
// @namespace    mym-consumo
// @version      1.0
// @description  Lee el reporte "Stock Tecnico Contrata" de Scord con tu sesion cada 5 minutos y actualiza la mochila en la pagina de consumo. Solo lectura: no cambia nada en Scord.
// @match        https://mymtelecomunicacionessixseven-art.github.io/consumo/*
// @connect      mifibra.scordsoft.net
// @grant        GM_xmlhttpRequest
// @run-at       document-idle
// ==/UserScript==
(function () {
  'use strict';
  // Mismo reporte que abre "Generar Reporte": filial LIMA, contrata MYM, todos los tecnicos
  const URL_REPORTE = 'https://mifibra.scordsoft.net/CReportes/Rep_StockTecnicoContratas.aspx'
    + '?IdFilial=9&IdContrata=88&NombreContrata=MYM+TELECOMUNICACIONES+S.A.C.&IdTecnico=0&NombreTecnico=TODOS';
  const CADA_MS = 5 * 60 * 1000;

  const avisar = datos => window.postMessage(Object.assign({ origen: 'mym-scord' }, datos), location.origin);

  function leer() {
    avisar({ tipo: 'leyendo' });
    GM_xmlhttpRequest({
      method: 'GET',
      url: URL_REPORTE + '&_=' + Date.now(),
      timeout: 60000,
      onload: r => {
        if (r.status !== 200) return avisar({ tipo: 'error', motivo: 'Scord respondio con el codigo ' + r.status + '.' });
        const doc = new DOMParser().parseFromString(r.responseText, 'text/html');
        const filas = [...doc.querySelectorAll('tr')]
          .filter(tr => !tr.querySelector('table'))
          .map(tr => [...tr.cells].map(c => c.textContent.trim()));
        if (!filas.some(f => f.includes('CodMaterial'))) return avisar({ tipo: 'error', motivo: 'sesion' });
        avisar({ tipo: 'stock', filas, leido: new Date().toISOString() });
      },
      onerror: () => avisar({ tipo: 'error', motivo: 'No se pudo conectar con Scord. Revisa tu internet.' }),
      ontimeout: () => avisar({ tipo: 'error', motivo: 'Scord tardo mas de un minuto en responder.' })
    });
  }

  leer();
  setInterval(leer, CADA_MS);
})();
