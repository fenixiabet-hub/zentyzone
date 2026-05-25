/**
 * Zentyzone — Privacy Policy
 * Bilingüe ES/EN con toggle.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { C } from '../../theme';
import { Logo } from '../Logo';

export function PrivacyPage() {
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
          {es ? 'Legal' : 'Legal'}
        </p>
        <h1 className="text-3xl font-bold mb-2" style={{ color: C.brown, letterSpacing: '-0.02em' }}>
          {es ? 'Política de Privacidad' : 'Privacy Policy'}
        </h1>
        <p className="text-sm mb-8" style={{ color: C.brownLight }}>
          {es ? 'Última actualización: 1 de enero de 2026' : 'Last updated: January 1, 2026'}
        </p>

        {/* ── Resumen rápido ── */}
        <div
          className="rounded-2xl p-5 mb-10"
          style={{ background: '#f0fdf4', border: '1.5px solid #86efac' }}
        >
          <p className="font-bold text-sm mb-3" style={{ color: '#15803d' }}>
            📋 {es ? 'RESUMEN RÁPIDO' : 'QUICK SUMMARY'}
          </p>
          <ul className="space-y-2 text-sm" style={{ color: '#166534' }}>
            {(es ? [
              'NO somos una "Covered Entity" de HIPAA — tú tampoco nos conviertes en una al usar el Servicio',
              'Implementamos salvaguardas de seguridad estándar de la industria',
              'NO entrenamos modelos de IA con tus notas ni con tu contenido',
              'NO vendemos tus datos personales',
              'NO compartimos información con anunciantes ni marketers',
              'Tú eres responsable de no subir PHI más allá de iniciales de clientes',
            ] : [
              'We are NOT a HIPAA "Covered Entity" — using our Service does not make us one',
              'We implement industry-standard security safeguards',
              'We do NOT train AI models with your notes or content',
              'We do NOT sell your personal data',
              'We do NOT share information with advertisers or marketers',
              'You are responsible for not uploading PHI beyond client initials',
            ]).map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="shrink-0 mt-0.5">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-10 text-sm leading-relaxed" style={{ color: C.brownSoft }}>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: C.brown }}>
              1. {es ? 'Quiénes Somos' : 'Who We Are'}
            </h2>
            <p>
              {es
                ? 'Zentyzone es una herramienta de software de redacción asistida por IA. No somos una clínica, no somos proveedores de servicios médicos o de salud, y no actuamos como "Covered Entity" ni "Business Associate" bajo HIPAA.'
                : 'Zentyzone is an AI-assisted writing software tool. We are not a clinic, we are not medical or healthcare service providers, and we do not act as a "Covered Entity" or "Business Associate" under HIPAA.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: C.brown }}>
              2. {es ? 'Información que Recopilamos' : 'Information We Collect'}
            </h2>
            <p className="mb-3 font-semibold" style={{ color: C.brown }}>
              {es ? 'Información que nos proporcionas directamente:' : 'Information you provide directly:'}
            </p>
            <ul className="space-y-2 ml-4 mb-4">
              {(es ? [
                'Dirección de correo electrónico (para tu cuenta)',
                'Contraseña (almacenada con hash seguro, nunca en texto plano)',
                'Contenido de texto que ingresas para generar notas (sesiones de trabajo)',
                'Información de pago (procesada por Stripe — nosotros nunca almacenamos datos de tarjeta)',
              ] : [
                'Email address (for your account)',
                'Password (stored with secure hash, never in plain text)',
                'Text content you enter to generate notes (work sessions)',
                'Payment information (processed by Stripe — we never store card data)',
              ]).map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0" style={{ color: C.mustardDark }}>•</span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="mb-3 font-semibold" style={{ color: C.brown }}>
              {es ? 'Información recopilada automáticamente:' : 'Automatically collected information:'}
            </p>
            <ul className="space-y-2 ml-4">
              {(es ? [
                'Datos de uso de la plataforma (número de notas generadas, frecuencia de uso)',
                'Información técnica básica (tipo de navegador, sistema operativo)',
                'Logs de errores técnicos para mejorar la estabilidad del Servicio',
              ] : [
                'Platform usage data (number of notes generated, usage frequency)',
                'Basic technical information (browser type, operating system)',
                'Technical error logs to improve Service stability',
              ]).map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0" style={{ color: C.mustardDark }}>•</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: C.brown }}>
              3. {es ? 'Cómo Usamos tu Información' : 'How We Use Your Information'}
            </h2>
            <ul className="space-y-2 ml-4">
              {(es ? [
                'Para operar y proveer el Servicio',
                'Para procesar pagos y gestionar tu suscripción',
                'Para enviarte comunicaciones relacionadas con el Servicio (actualizaciones, avisos importantes)',
                'Para mejorar la funcionalidad y estabilidad de la Plataforma',
                'Para cumplir con obligaciones legales',
              ] : [
                'To operate and provide the Service',
                'To process payments and manage your subscription',
                'To send you Service-related communications (updates, important notices)',
                'To improve Platform functionality and stability',
                'To comply with legal obligations',
              ]).map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0" style={{ color: C.mustardDark }}>•</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: C.brown }}>
              4. {es ? 'Contenido de tus Notas e IA' : 'Your Note Content and AI'}
            </h2>
            <p className="mb-3">
              {es
                ? 'El texto que ingresas para generar notas es enviado a la API de Anthropic (Claude) únicamente para procesar tu solicitud y devolverte el borrador. Zentyzone NO usa tu contenido para:'
                : 'The text you enter to generate notes is sent to the Anthropic API (Claude) solely to process your request and return the draft. Zentyzone does NOT use your content to:'}
            </p>
            <ul className="space-y-2 ml-4 mb-3">
              {(es ? [
                'Entrenar o mejorar modelos de IA',
                'Crear perfiles de comportamiento clínico',
                'Vender o compartir con terceros',
              ] : [
                'Train or improve AI models',
                'Create clinical behavior profiles',
                'Sell or share with third parties',
              ]).map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span style={{ color: '#b4412e' }}>✗</span>
                  {item}
                </li>
              ))}
            </ul>
            <p>
              {es
                ? 'Recomendamos encarecidamente NO incluir información de identificación directa de clientes (nombres completos, fechas de nacimiento, números de seguro). Usa solo iniciales.'
                : 'We strongly recommend NOT including directly identifying client information (full names, dates of birth, insurance numbers). Use initials only.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: C.brown }}>
              5. {es ? 'Compartición de Información' : 'Information Sharing'}
            </h2>
            <p className="mb-3">
              {es ? 'Compartimos información únicamente con:' : 'We share information only with:'}
            </p>
            <ul className="space-y-2 ml-4">
              {(es ? [
                'Supabase — proveedor de base de datos e infraestructura de autenticación',
                'Stripe — procesador de pagos (no recibe datos de tus notas)',
                'Anthropic — procesamiento de IA (solo el texto de tu sesión, sin datos de cuenta)',
                'Autoridades legales — cuando sea requerido por ley o proceso legal válido',
              ] : [
                'Supabase — database provider and authentication infrastructure',
                'Stripe — payment processor (does not receive your note data)',
                'Anthropic — AI processing (only your session text, without account data)',
                'Legal authorities — when required by law or valid legal process',
              ]).map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0" style={{ color: C.mustardDark }}>•</span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-3 font-semibold" style={{ color: C.brown }}>
              {es
                ? 'Nunca vendemos, alquilamos ni compartimos tus datos con anunciantes, marketers ni brokers de datos.'
                : 'We never sell, rent, or share your data with advertisers, marketers, or data brokers.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: C.brown }}>
              6. {es ? 'Seguridad' : 'Security'}
            </h2>
            <ul className="space-y-2 ml-4">
              {(es ? [
                'Datos en tránsito: cifrados con TLS/HTTPS',
                'Contraseñas: almacenadas con bcrypt (nunca en texto plano)',
                'Base de datos: cifrado en reposo con Row-Level Security (RLS)',
                'Acceso limitado: solo el usuario autenticado puede acceder a sus propios datos',
              ] : [
                'Data in transit: encrypted with TLS/HTTPS',
                'Passwords: stored with bcrypt (never in plain text)',
                'Database: encrypted at rest with Row-Level Security (RLS)',
                'Limited access: only the authenticated user can access their own data',
              ]).map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0" style={{ color: C.mustardDark }}>•</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: C.brown }}>
              7. {es ? 'Tus Derechos' : 'Your Rights'}
            </h2>
            <ul className="space-y-2 ml-4">
              {(es ? [
                'Acceso: puedes solicitar una copia de tus datos personales',
                'Corrección: puedes actualizar tu información de cuenta',
                'Eliminación: puedes solicitar la eliminación de tu cuenta y datos',
                'Portabilidad: puedes solicitar tus datos en formato exportable',
                'Objeción: puedes objetar ciertos usos de tus datos',
              ] : [
                'Access: you can request a copy of your personal data',
                'Correction: you can update your account information',
                'Deletion: you can request deletion of your account and data',
                'Portability: you can request your data in an exportable format',
                'Objection: you can object to certain uses of your data',
              ]).map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0" style={{ color: C.mustardDark }}>•</span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-3">
              {es
                ? 'Para ejercer cualquiera de estos derechos, contáctanos en '
                : 'To exercise any of these rights, contact us at '}
              <a href="mailto:support@zentyzone.com" style={{ color: C.mustardDark, fontWeight: 600 }}>
                support@zentyzone.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: C.brown }}>
              8. {es ? 'Retención de Datos' : 'Data Retention'}
            </h2>
            <p>
              {es
                ? 'Conservamos tus datos mientras tu cuenta esté activa. Al eliminar tu cuenta, eliminaremos tus datos personales dentro de los 30 días siguientes, excepto donde la ley requiera retención por mayor tiempo.'
                : 'We retain your data while your account is active. Upon account deletion, we will delete your personal data within 30 days, except where law requires longer retention.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: C.brown }}>
              9. {es ? 'Cookies y Tecnologías Similares' : 'Cookies and Similar Technologies'}
            </h2>
            <p>
              {es
                ? 'Utilizamos cookies esenciales para el funcionamiento del Servicio (autenticación, sesión). Consulta nuestra '
                : 'We use essential cookies for Service operation (authentication, session). See our '}
              <a href="/cookies" style={{ color: C.mustardDark, fontWeight: 600 }}>
                {es ? 'Política de Cookies' : 'Cookie Policy'}
              </a>
              {es ? ' para más detalles.' : ' for more details.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: C.brown }}>
              10. {es ? 'Menores de Edad' : 'Minors'}
            </h2>
            <p>
              {es
                ? 'El Servicio no está dirigido a personas menores de 18 años. No recopilamos intencionalmente datos de menores.'
                : 'The Service is not directed to persons under 18 years of age. We do not intentionally collect data from minors.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: C.brown }}>
              11. {es ? 'Cambios en esta Política' : 'Changes to This Policy'}
            </h2>
            <p>
              {es
                ? 'Notificaremos cambios materiales por correo electrónico con 30 días de anticipación. El uso continuado del Servicio constituye aceptación de la política actualizada.'
                : 'We will notify you of material changes by email 30 days in advance. Continued use of the Service constitutes acceptance of the updated policy.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: C.brown }}>
              12. {es ? 'Contacto' : 'Contact'}
            </h2>
            <p>
              {es ? 'Preguntas sobre esta Política: ' : 'Questions about this Policy: '}
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
