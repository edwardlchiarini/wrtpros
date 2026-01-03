WRTPros.com Website Package (Static + Simple)

What this is:
- A fast, modern static website (HTML/CSS/JS) + a PHP contact form handler.
- Includes a Dallas-centered service area map with an approximate 1-hour radius circle.

Important limitations:
- I cannot log into your server to upload files or create email accounts from here.
  But this package is ready to upload and includes exact setup steps below.

UPLOAD (cPanel / File Manager):
1) Log into your hosting control panel.
2) Open File Manager.
3) Go to public_html/ (or the domain's web root).
4) Upload the ZIP and Extract (or upload files directly).
5) Visit https://wrtpros.com

CONTACT FORM (email to contact@wrtpros.com):
- Form posts to /contact.php.
- contact.php uses PHP mail(). Many hosts support it, some block it.
- If emails don't arrive, use SMTP.

SMTP OPTIONS (recommended if mail() is blocked):
A) Use your host's SMTP (common in cPanel)
   - Create mailbox: contact@wrtpros.com
   - Then switch contact.php to an SMTP library (PHPMailer).
B) Use Google Workspace / Microsoft 365 for domain email
C) Use Mailgun/SendGrid for form sending

EMAIL ACCOUNT SETUP (typical cPanel):
1) Email Accounts -> Create -> contact@wrtpros.com
2) Set password + mailbox quota
3) Enable SPF/DKIM in Email Deliverability
4) Add to your phone/computer via IMAP

MAP NOTES:
- The circle is a VISUAL approximation (~60 miles / 96.5 km).
- True 1-hour drive-time boundaries require a routing API (Mapbox or OpenRouteService).

EDIT CONTENT:
- Update phone/address in index.html if needed.
- Work Gallery page is /pages/gallery.html

Current displayed numbers:
- Emergency (Call/Text): (469) 759-9659
- Office: (214) 978-7488