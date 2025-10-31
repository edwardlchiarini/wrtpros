(function () {
  const form = document.getElementById('contact-form');
  const statusEl = document.getElementById('form-status');

  if (!form) {
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    statusEl.textContent = 'Sending your message...';
    statusEl.className = '';

    const formData = new FormData(form);
    const payload = {
      name: formData.get('name')?.trim(),
      email: formData.get('email')?.trim(),
      phone: formData.get('phone')?.trim(),
      message: formData.get('message')?.trim(),
    };

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
          body.message ||
          'Something went wrong. Please call us directly or try again later.';
        statusEl.className = 'error';
      }
    } catch (error) {
      statusEl.textContent =
        'We could not send your message right now. Please try again later.';
      statusEl.className = 'error';
      console.error('Failed to submit contact form', error);
    }
  });
})();
