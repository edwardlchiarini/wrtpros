(function () {
  const form = document.getElementById('contact-form');
  const statusEl = document.getElementById('form-status');
  const yearEl = document.getElementById('year');

  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  if (!form) {
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!statusEl) return;
    statusEl.textContent = 'Sending your message...';
    statusEl.className = '';

    const formData = new FormData(form);
    const payload = {
      name: formData.get('name')?.trim(),
      email: formData.get('email')?.trim(),
      phone: formData.get('phone')?.trim(),
      message: formData.get('message')?.trim(),
      service: formData.get('service')?.trim(),
    };

    const fallback = document.getElementById('email-fallback');
    if (fallback) {
      const subject = 'WRTPros service request: ' + (payload.service || 'Inspection');
      const body = `Name: ${payload.name}\nPhone: ${payload.phone}\nEmail: ${payload.email || ''}\nService: ${payload.service || ''}\n\n${payload.message}`;
      fallback.href = 'mailto:edwardlchiarini@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      fallback.hidden = true;
    }
    const submit = form.querySelector('[type=submit]');
    if (submit) submit.disabled = true;

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const body = await response.json().catch(() => ({ message: '' }));

      if (response.ok) {
        statusEl.textContent = body.message || 'Thanks! We will text you shortly.';
        statusEl.className = 'success';
        form.reset();
      } else {
        statusEl.textContent =
          body.message || 'Something went wrong. Please call us directly or try again later.';
        statusEl.className = 'error';
        statusEl.textContent = 'Your request was not sent. Please call, text, or use the email button below.';
        if (fallback) fallback.hidden = false;
      }
    } catch (error) {
      statusEl.textContent =
        'We could not send your message right now. Please try again later.';
      statusEl.className = 'error';
      if (fallback) fallback.hidden = false;
      statusEl.textContent = 'Your request was not sent. Please call, text, or use the email button below.';
    } finally {
      if (submit) submit.disabled = false;
    }
  });
})();
