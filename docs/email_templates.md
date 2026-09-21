# Plantillas de Correo para Supabase Auth · DuiChinese

Para que los correos que reciben tus alumnos (confirmación de cuenta y recuperación de contraseña) tengan la identidad visual oficial de **DuiChinese** (`#960708` carmesí imperial y `#FECB6D` dorado cálido), solo tienes que copiar y pegar estas plantillas en tu panel de Supabase.

---

## 📍 Dónde configurarlo en Supabase

1. Entra en tu panel de Supabase: [https://supabase.com/dashboard/project/biijwmvcpshpxgbtepws](https://supabase.com/dashboard/project/biijwmvcpshpxgbtepws)
2. En la barra lateral izquierda, ve a **Authentication** ➔ **Email Templates**.
3. Selecciona cada plantilla, reemplaza el código HTML por el proporcionado abajo y pulsa **Save**.

---

## 1. 🔑 Reset Password (Recuperación de Contraseña)

- **Asunto sugerido (Subject):** `Restablece tu contraseña de DuiChinese`
- **Contenido HTML:**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Restablecer Contraseña - DuiChinese</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F5F2EB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F5F2EB; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" max-width="520px" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; background-color: #FFFFFF; border-radius: 28px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(150, 7, 8, 0.08); border: 1px solid rgba(150, 7, 8, 0.12);">
          
          <!-- Top Crimson Accent Bar -->
          <tr>
            <td style="background-color: #960708; height: 8px;"></td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 40px 36px 32px 36px; text-align: center;">
              
              <!-- Brand Header -->
              <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #7A0607; letter-spacing: -0.5px;">
                对 Chinese
              </h1>
              <p style="margin: 6px 0 24px 0; font-size: 13px; color: #960708; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px;">
                Recuperación de acceso
              </p>

              <!-- Description -->
              <p style="margin: 0 0 18px 0; font-size: 15px; line-height: 24px; color: #3A3A3A; text-align: left;">
                Hola,
              </p>
              <p style="margin: 0 0 28px 0; font-size: 15px; line-height: 24px; color: #3A3A3A; text-align: left;">
                Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>DuiChinese</strong>. Pulsa el botón inferior para elegir una nueva contraseña segura:
              </p>

              <!-- Primary Gold Action Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto 30px auto;">
                <tr>
                  <td align="center" style="border-radius: 9999px; background-color: #FECB6D; box-shadow: 0 4px 14px rgba(150, 7, 8, 0.2);">
                    <a href="{{ .ConfirmationURL }}" target="_blank" style="display: inline-block; padding: 14px 34px; font-size: 15px; font-weight: bold; color: #7A0607; text-decoration: none; border-radius: 9999px; letter-spacing: 0.2px;">
                      Restablecer mi contraseña
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Notice -->
              <p style="margin: 0; font-size: 13px; line-height: 20px; color: #7A0607; opacity: 0.75; text-align: left;">
                Si tú no has solicitado este cambio, puedes ignorar este correo con total tranquilidad. El enlace expirará automáticamente por seguridad.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #FDFBF7; padding: 18px 36px; border-top: 1px solid rgba(150, 7, 8, 0.08); text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #7A0607; opacity: 0.7;">
                © 2026 DuiChinese · Repetición espaciada para dominar los caracteres Hanzi.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 2. ✉️ Confirm Signup (Confirmación de Correo)

- **Asunto sugerido (Subject):** `Confirma tu cuenta en DuiChinese`
- **Contenido HTML:**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenido a DuiChinese</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F5F2EB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F5F2EB; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" max-width="520px" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; background-color: #FFFFFF; border-radius: 28px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(150, 7, 8, 0.08); border: 1px solid rgba(150, 7, 8, 0.12);">
          
          <!-- Top Crimson Accent Bar -->
          <tr>
            <td style="background-color: #960708; height: 8px;"></td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 40px 36px 32px 36px; text-align: center;">
              
              <!-- Brand Header -->
              <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #7A0607; letter-spacing: -0.5px;">
                对 Chinese
              </h1>
              <p style="margin: 6px 0 24px 0; font-size: 13px; color: #960708; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px;">
                ¡Bienvenido/a a tu viaje de Hanzi!
              </p>

              <!-- Description -->
              <p style="margin: 0 0 18px 0; font-size: 15px; line-height: 24px; color: #3A3A3A; text-align: left;">
                ¡Nos alegra tenerte con nosotros!
              </p>
              <p style="margin: 0 0 28px 0; font-size: 15px; line-height: 24px; color: #3A3A3A; text-align: left;">
                Para activar tu cuenta y comenzar a sincronizar tus repasos diarios y caracteres HSK1 desbloqueados en la nube, confirma tu correo pulsando el botón:
              </p>

              <!-- Primary Gold Action Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto 30px auto;">
                <tr>
                  <td align="center" style="border-radius: 9999px; background-color: #FECB6D; box-shadow: 0 4px 14px rgba(150, 7, 8, 0.2);">
                    <a href="{{ .ConfirmationURL }}" target="_blank" style="display: inline-block; padding: 14px 34px; font-size: 15px; font-weight: bold; color: #7A0607; text-decoration: none; border-radius: 9999px; letter-spacing: 0.2px;">
                      Confirmar mi correo
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Notice -->
              <p style="margin: 0; font-size: 13px; line-height: 20px; color: #7A0607; opacity: 0.75; text-align: left;">
                Si no has creado una cuenta en DuiChinese, puedes ignorar este mensaje sin inconveniente.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #FDFBF7; padding: 18px 36px; border-top: 1px solid rgba(150, 7, 8, 0.08); text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #7A0607; opacity: 0.7;">
                © 2026 DuiChinese · Repetición espaciada inteligente para dominar el chino mandarín.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```
