/**
 * Zentyzone — Cookie Policy
 * Bilingüe ES/EN con toggle.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { C } from '../../theme';
import { Logo } from '../Logo';

export function CookiesPage() {
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const navigate = useNavigate();
  const es = lang === 'es';

  return (
    <div
      className="min-h-screen"
      style={{ background: C.cream, fontFamily: "'DM Sans', sans-serif", color: C.brown }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
        style={{ background: C.cream, borderBottom: `1px solid ${C.creamWarm}` }}
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
          style={{ color: C.brownSoft }}
        >
          <ArrowLeft className="w-4 h-4" />
          {es ? 'Volver' : 'Back'}
        </button>
        <div className="flex items-center gap-2">
          <Logo size={28} />
          <span className="font-bold text-sm" style={{ color: C.brown }}>Zentyzone</span>
        </div>
        <button
          onClick={() => setLang(es ? 'en' : 'es')}
          className="text-xs px-3 py-1.5 rounded-full font-semibold transition-all hover:opacity-80"
          style={{ background: C.mustardSoft, color: C.brown }}
        >
          {es ? 'English' : 'Español'}
        </button>
      </header>

      <div className="max-w-[720px] mx-auto px-6 py-12">
        <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: C.mustardDark }}>
          Legal
        </p>
        <h1 className="text-3xl font-bold mb-2" style={{ color: C.brown, letterSpacing: '-0.02em' }}>
          {es ? 'Política de Cookies' : 'Cookie Policy'}
        </h1>
        <p className="text-sm mb-10" style={{ color: C.brownLight }}>
          {es ? 'Última actualización: 1 de enero de 2026' : 'Last updated: January 1, 2026'}
        </p>

        <div className="space-y-10 text-sm leading-relaxed" style={{ color: C.brownSoft }}>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: C.brown }}>
              1. {es ? '¿Qué son las cookies?' : 'What Are Cookies?'}
            </h2>
            <p>
              {es
                ? 'Las cookies son pequeños archivos de texto que los sitios web almacenan en tu navegador. Se usan para recordar información sobre ti entre visitas y para mejorar tu experiencia de uso.'
                : 'Cookies are small text files that websites store in your browser. They are used to remember information about you between visits and to improve your user experience.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: C.brown }}>
              2. {es ? 'Cookies que Usamos' : 'Cookies We Use'}
            </h2>

            {/* Tabla de cookies */}
            <div className="space-y-4">
              {[
                {
                  tipo: es ? 'Esenciales de Autenticación' : 'Essential Authentication',
                  descripcion: es
                    ? 'Cookies de sesión de Supabase necesarias para mantener tu sesión activa mientras usas la app. Sin estas cookies, no puedes iniciar sesión.'
                    : 'Supabase session cookies necessary to keep your session active while using the app. Without these cookies, you cannot log in.',
                  nombre: 'sb-*-auth-token',
                  duracion: es ? 'Sesión / hasta cierre de sesión' : 'Session / until sign-out',
                  necesaria: true,
                },
                {
                  tipo: es ? 'Preferencias de Idioma' : 'Language Preferences',
                  descripcion: es
                    ? 'Recuerda si prefieres la interfaz en español o inglés entre visitas.'
                    : 'Remembers whether you prefer the interface in Spanish or English between visits.',
                  nombre: 'zenty_lang',
                  duracion: es ? '1 año' : '1 year',
                  necesaria: false,
                },
                {
                  tipo: es ? 'Sesión de App' : 'App Session',
                  descripcion: es
                    ? 'Identificador de sesión único almacenado en localStorage (no cookie propiamente) para verificar que solo un dispositivo usa la cuenta a la vez.'
                    : 'Unique session identifier stored in localStorage (not a cookie per se) to verify that only one device uses the account at a time.',
                  nombre: 'zenty_session_id',
                  duracion: es ? 'Hasta cierre de sesión' : 'Until sign-out',
                  necesaria: true,
                },
              ].map((cookie, i) => (
                <div
                  key={i}
                  className="rounded-2xl p-5"
                  style={{ background: 'white', border: `1px solid ${C.creamWarm}` }}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="font-semibold text-sm" style={{ color: C.brown }}>
                      {cookie.tipo}
                    </p>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full shrink-0"
                      style={{
                        background: cookie.necesaria ? '#f0fdf4' : C.mustardSoft + '40',
                        color: cookie.necesaria ? '#15803d' : C.mustardDark,
                        fontWeight: 600,
                      }}
                    >
                      {cookie.necesaria
                        ? (es ? 'Necesaria' : 'Essential')
                        : (es ? 'Funcional' : 'Functional')}
                    </span>
                  </div>
                  <p className="text-xs mb-3" style={{ color: C.brownSoft }}>
                    {cookie.descripcion}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: C.brownLight }}>
                    <div>
                      <span className="font-semibold">{es ? 'Nombre: ' : 'Name: '}</span>
                      <code style={{ fontFamily: "'JetBrains Mono', monospace" }}>{cookie.nombre}</code>
                    </div>
                    <div>
                      <span className="font-semibold">{es ? 'Duración: ' : 'Duration: '}</span>
                      {cookie.duracion}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: C.brown }}>
              3. {es ? 'Cookies que NO Usamos' : 'Cookies We Do NOT Use'}
            </h2>
            <ul className="space-y-2 ml-4">
              {(es ? [
                'Cookies de seguimiento publicitario',
                'Cookies de terceros para marketing o remarketing',
                'Cookies de análisis de comportamiento intrusivo',
                'Píxeles de seguimiento de redes sociales',
              ] : [
                'Advertising tracking cookies',
                'Third-party cookies for marketing or remarketing',
                'Intrusive behavior analytics cookies',
                'Social media tracking pixels',
              ]).map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span style={{ color: '#b4412e' }}>✗</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: C.brown }}>
              4. {es ? 'Herramientas de Análisis' : 'Analytics Tools'}
            </h2>
            <p>
              {es
                ? 'Actualmente Zentyzone no utiliza herramientas de análisis de terceros (como Google Analytics). Si en el futuro implementamos alguna, actualizaremos esta Política y notificaremos a los usuarios con 30 días de anticipación.'
                : 'Zentyzone does not currently use third-party analytics tools (such as Google Analytics). If we implement any in the future, we will update this Policy and notify users with 30 days\' notice.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: C.brown }}>
              5. {es ? 'Cómo Gestionar las Cookies' : 'How to Manage Cookies'}
            </h2>
            <p className="mb-3">
              {es
                ? 'Puedes controlar y eliminar cookies desde la configuración de tu navegador:'
                : 'You can control and delete cookies from your browser settings:'}
            </p>
            <ul className="space-y-2 ml-4">
              {[
                { name: 'Chrome', url: 'chrome://settings/cookies' },
                { name: 'Firefox', url: 'about:preferences#privacy' },
                { name: 'Safari', url: es ? 'Preferencias → Privacidad' : 'Preferences → Privacy' },
                { name: 'Edge', url: 'edge://settings/privacy' },
              ].map((b, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0" style={{ color: C.mustardDark }}>•</span>
                  <span>
                    <strong>{b.name}:</strong>{' '}
                    <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem' }}>
                      {b.url}
                    </code>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3">
              {es
                ? 'Nota: desactivar las cookies esenciales impedirá el uso del Servicio, ya que son necesarias para la autenticación.'
                : 'Note: disabling essential cookies will prevent use of the Service, as they are required for authentication.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: C.brown }}>
              6. {es ? 'Cambios en esta Política' : 'Changes to This Policy'}
            </h2>
            <p>
              {es
                ? 'Actualizaremos esta Política si cambia el uso de cookies. Te notificaremos con 30 días de anticipación por correo electrónico.'
                : 'We will update this Policy if cookie usage changes. We will notify you 30 days in advance by email.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: C.brown }}>
              7. {es ? 'Contacto' : 'Contact'}
            </h2>
            <p>
              {es ? 'Preguntas: ' : 'Questions: '}
              <a href="mailto:support@zentyzone.com" style={{ color: C.mustardDark, fontWeight: 600 }}>
                support@zentyzone.com
              </a>
            </p>
          </section>
        </div>

        <div
          className="mt-16 pt-8 text-xs text-center"
          style={{ borderTop: `1px solid ${C.creamWarm}`, color: C.brownLight }}
        >
          <p>
            {es
              ? 'Zentyzone es un asistente de redacción. No somos clínica ni proveedor de servicios médicos.'
              : 'Zentyzone is a writing assistant. We are not a clinic or medical service provider.'}
          </p>
          <p className="mt-1">© 2026 Zentyzone · Florida, USA</p>
        </div>
      </div>
    </div>
  );
}
