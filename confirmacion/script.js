const EMAILJS_PUBLIC_KEY = 'MHnxz9mQh-R9v90iD';
const EMAILJS_SERVICE_ID = 'service_o70lh63';
const EMAILJS_TEMPLATE_ID = 'template_fxct6ys';
const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbwXl4NQuH4rYumCVcDu9CmzamHvvHsILmMciNy1FaqR2daQlCsfyUQPAzQWz02sDJLq2A/exec';

emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });

const form = document.getElementById('rsvp-form');
const hijosContainer = document.getElementById('hijos-container');
const addHijoBtn = document.getElementById('add-hijo');
const traeHijosRadios = document.querySelectorAll('input[name="trae_hijos"]');
const intolerContainer = document.getElementById('intolerancias-container');
const addIntoleranciaBtn = document.getElementById('add-intolerancia');
const tieneIntoleranciaRadios = document.querySelectorAll('input[name="tiene_intolerancia"]');
const formError = document.getElementById('form-error');
const formSuccess = document.getElementById('form-success');
const submitBtn = document.getElementById('submit-btn');
const telefonoInput = document.getElementById('telefono_movil');

let hijoIndex = 1;
let intoleranciaIndex = 1;

traeHijosRadios.forEach((radio) => {
  radio.addEventListener('change', () => {
    const traeHijos = radio.value === 'si';
    hijosContainer.hidden = !traeHijos;
    hijosContainer.querySelectorAll('.hijo-nombre, .hijo-edad').forEach((input) => {
      input.required = traeHijos;
    });
    if (!traeHijos) {
      hijosContainer.querySelectorAll('.hijo-row').forEach((row, i) => {
        if (i > 0) row.remove();
        else row.querySelectorAll('input').forEach((input) => (input.value = ''));
      });
    }
  });
});

addHijoBtn.addEventListener('click', () => {
  hijoIndex += 1;
  const row = document.createElement('div');
  row.className = 'hijo-row';
  row.innerHTML = `
    <input type="text" class="hijo-nombre" name="hijo_nombre_${hijoIndex}" placeholder="Nombre del niño/a" required />
    <input type="number" class="hijo-edad" name="hijo_edad_${hijoIndex}" placeholder="Edad" min="0" max="50" required />
  `;
  hijosContainer.insertBefore(row, addHijoBtn);
});

tieneIntoleranciaRadios.forEach((radio) => {
  radio.addEventListener('change', () => {
    const tieneIntolerancia = radio.value === 'si';
    intolerContainer.hidden = !tieneIntolerancia;
    intolerContainer
      .querySelectorAll('.intolerancia-nombre, .intolerancia-detalle, #telefono_movil')
      .forEach((input) => {
        input.required = tieneIntolerancia;
      });
    if (!tieneIntolerancia) {
      telefonoInput.value = '';
      intolerContainer.querySelectorAll('.intolerancia-row').forEach((row, i) => {
        if (i > 0) row.remove();
        else row.querySelectorAll('input').forEach((input) => (input.value = ''));
      });
    }
    validarTelefono();
  });
});

// Acepta dígitos, espacios, guiones, puntos, paréntesis y un + inicial opcional
function validarTelefono() {
  const valor = telefonoInput.value.trim();
  if (!valor) {
    telefonoInput.setCustomValidity(telefonoInput.required ? 'Introduce un número de teléfono.' : '');
    return;
  }
  const digitos = valor.replace(/[^0-9]/g, '');
  const formatoValido = /^\+?[0-9\s().-]+$/.test(valor);
  if (!formatoValido || digitos.length < 9 || digitos.length > 15) {
    telefonoInput.setCustomValidity('Introduce un número de teléfono válido (mínimo 9 dígitos).');
  } else {
    telefonoInput.setCustomValidity('');
  }
}

validarTelefono();
telefonoInput.addEventListener('input', validarTelefono);

addIntoleranciaBtn.addEventListener('click', () => {
  intoleranciaIndex += 1;
  const row = document.createElement('div');
  row.className = 'intolerancia-row';
  row.innerHTML = `
    <input type="text" class="intolerancia-nombre" name="intolerancia_nombre_${intoleranciaIndex}" placeholder="Nombre" required />
    <input type="text" class="intolerancia-detalle" name="intolerancia_detalle_${intoleranciaIndex}" placeholder="Intolerancia" required />
  `;
  intolerContainer.insertBefore(row, addIntoleranciaBtn);
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  formError.hidden = true;
  formSuccess.hidden = true;

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const datos = Object.fromEntries(new FormData(form).entries());
  const traeHijos = form.querySelector('input[name="trae_hijos"]:checked').value === 'si';
  const tieneIntolerancia = form.querySelector('input[name="tiene_intolerancia"]:checked').value === 'si';

  // Recopila las filas de hijos añadidas dinámicamente en un único texto (solo si la respuesta es "sí")
  const hijos = [];
  if (traeHijos) {
    hijosContainer.querySelectorAll('.hijo-row').forEach((row) => {
      const nombre = row.querySelector('.hijo-nombre').value;
      const edad = row.querySelector('.hijo-edad').value;
      if (nombre) hijos.push(`${nombre} (${edad} años)`);
    });
  }
  datos.hijos = hijos.length ? hijos.join(', ') : 'No traen hijos';

  // Recopila las filas de intolerancias añadidas dinámicamente en un único texto (solo si la respuesta es "sí")
  const intolerancias = [];
  if (tieneIntolerancia) {
    intolerContainer.querySelectorAll('.intolerancia-row').forEach((row) => {
      const nombre = row.querySelector('.intolerancia-nombre').value;
      const detalle = row.querySelector('.intolerancia-detalle').value;
      if (nombre) intolerancias.push(`${nombre}: ${detalle}`);
    });
  } else {
    datos.telefono_movil = '';
  }
  datos.intolerancias = intolerancias.length ? intolerancias.join(', ') : 'Sin intolerancias';

  submitBtn.disabled = true;
  submitBtn.textContent = 'Enviando...';

  Promise.all([enviarEmail(datos), guardarEnGoogleSheets(datos)])
    .then(() => {
      formSuccess.hidden = false;
      form.reset();
      hijosContainer.hidden = true;
      hijosContainer.querySelectorAll('.hijo-row').forEach((row, i) => {
        if (i > 0) row.remove();
      });
      intolerContainer.hidden = true;
      intolerContainer.querySelectorAll('.intolerancia-row').forEach((row, i) => {
        if (i > 0) row.remove();
      });
    })
    .catch((error) => {
      console.error(error);
      formError.hidden = false;
      formError.textContent = 'Ha ocurrido un error al enviar la confirmación. Por favor, inténtalo de nuevo.';
    })
    .finally(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enviar confirmación';
    });
});

function enviarEmail(datos) {
  return emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, datos);
}

function guardarEnGoogleSheets(datos) {
  // no-cors: no podemos leer la respuesta, pero el registro se guarda igualmente
  return fetch(GOOGLE_SHEETS_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });
}
