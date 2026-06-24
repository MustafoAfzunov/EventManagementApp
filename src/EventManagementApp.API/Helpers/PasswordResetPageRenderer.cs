using System.Net;
using System.Text;
using System.Text.Json;

namespace EventManagementApp.API.Helpers;

public static class PasswordResetPageRenderer
{
    public static string RenderInvalid(string message) => RenderPage(errorMessage: message, token: null);

    public static string RenderValid(string token) => RenderPage(errorMessage: null, token: token);

    private static string RenderPage(string? errorMessage, string? token)
    {
        var body = string.IsNullOrWhiteSpace(token)
            ? BuildInvalidBody(errorMessage)
            : BuildFormBody(token);

        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <title>Reset password</title>
              <style>
                body { font-family: system-ui, sans-serif; max-width: 420px; margin: 48px auto; padding: 0 16px; color: #1f2937; }
                h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
                form { display: grid; gap: 12px; margin-top: 20px; }
                label { font-weight: 600; }
                input { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 1rem; }
                button { margin-top: 8px; padding: 12px; border: 0; border-radius: 8px; background: #2563eb; color: white; font-size: 1rem; cursor: pointer; }
                button:hover { background: #1d4ed8; }
                .status { margin-top: 16px; padding: 12px; border-radius: 8px; }
                .status.error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
                .status.success { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
              </style>
            </head>
            <body>
            """ + body + """
            </body>
            </html>
            """;
    }

    private static string BuildInvalidBody(string? errorMessage)
    {
        var message = WebUtility.HtmlEncode(errorMessage ?? "This password reset link is invalid or has expired.");
        return $"""
            <h1>Password reset link invalid</h1>
            <p>{message}</p>
            <p>Request a new link using POST /api/auth/forgot-password.</p>
            """;
    }

    private static string BuildFormBody(string token)
    {
        var script = new StringBuilder();
        script.AppendLine("<script>");
        script.Append("const token = ").Append(JsonSerializer.Serialize(token)).AppendLine(";");
        script.AppendLine("""
            const form = document.getElementById('reset-form');
            const status = document.getElementById('status');

            form.addEventListener('submit', async (event) => {
              event.preventDefault();
              status.hidden = true;
              status.className = 'status';

              const newPassword = document.getElementById('newPassword').value;
              const confirmPassword = document.getElementById('confirmPassword').value;

              if (newPassword !== confirmPassword) {
                status.textContent = 'Passwords do not match.';
                status.className = 'status error';
                status.hidden = false;
                return;
              }

              try {
                const response = await fetch('/api/auth/reset-password', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ token, newPassword })
                });

                const payload = await response.json().catch(() => ({ message: 'Unexpected server response.' }));

                if (!response.ok) {
                  status.textContent = payload.message || 'Could not reset password.';
                  status.className = 'status error';
                  status.hidden = false;
                  return;
                }

                form.hidden = true;
                status.textContent = payload.message || 'Password has been reset successfully.';
                status.className = 'status success';
                status.hidden = false;
              } catch {
                status.textContent = 'Network error. Make sure the API is running and try again.';
                status.className = 'status error';
                status.hidden = false;
              }
            });
            """);
        script.AppendLine("</script>");

        return """
            <h1>Reset your password</h1>
            <p>Choose a new password for your account.</p>
            <form id="reset-form">
              <label for="newPassword">New password</label>
              <input id="newPassword" name="newPassword" type="password" minlength="8" maxlength="100" required autocomplete="new-password" />
              <label for="confirmPassword">Confirm password</label>
              <input id="confirmPassword" name="confirmPassword" type="password" minlength="8" maxlength="100" required autocomplete="new-password" />
              <button type="submit">Update password</button>
            </form>
            <p id="status" class="status" hidden></p>
            """ + script;
    }
}
