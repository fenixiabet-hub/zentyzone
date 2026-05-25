/**
 * Zentyzone — Terms of Service
 * Bilingüe ES/EN con toggle.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { C } from '../../theme';
import { Logo } from '../Logo';

export function TermsPage() {
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
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
            style={{ color: C.brownSoft }}
          >
            <ArrowLeft className="w-4 h-4" />
            {es ? 'Volver' : 'Back'}
          </button>
        </div>
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

      {/* Body */}
      <div className="max-w-[720px] mx-auto px-6 py-12">
        <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: C.mustardDark }}>
          {es ? 'Legal' : 'Legal'}
        </p>
        <h1 className="text-3xl font-bold mb-2" style={{ color: C.brown, letterSpacing: '-0.02em' }}>
          {es ? 'Términos de Servicio' : 'Terms of Service'}
        </h1>
        <p className="text-sm mb-10" style={{ color: C.brownLight }}>
          {es ? 'Última actualización: 1 de enero de 2026 · Versión v1.0' : 'Last updated: January 1, 2026 · Version v1.0'}
        </p>

        {/* ── AVISO CRÍTICO ── */}
        <div
          className="rounded-2xl p-6 mb-10"
          style={{ background: '#fef9ec', border: `2px solid ${C.mustard}` }}
        >
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: C.mustardDark }} />
            <h2 className="font-bold text-base" style={{ color: C.mustardDark }}>
              {es ? '⚠️ AVISO IMPORTANTE — LEE ANTES DE CONTINUAR' : '⚠️ IMPORTANT NOTICE — READ BEFORE CONTINUING'}
            </h2>
          </div>
          <div className="space-y-3 text-sm" style={{ color: C.brown }}>
            <p className="font-semibold">
              {es
                ? 'Zentyzone es un servicio de redacción asistida por IA. NO somos:'
                : 'Zentyzone is an AI-assisted writing service. We are NOT:'}
            </p>
            <ul className="space-y-1.5 ml-4">
              {(es ? [
                'Una clínica de salud mental',
                'Proveedores de servicios médicos o de salud',
                'Médicos, terapeutas, BCBAs ni RBTs licenciados',
                'Abogados ni consultores legales',
                'Una "Covered Entity" bajo HIPAA',
              ] : [
                'A mental health clinic',
                'Medical or healthcare service providers',
                'Licensed doctors, therapists, BCBAs, or RBTs',
                'Attorneys or legal consultants',
                'A "Covered Entity" under HIPAA',
              ]).map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span style={{ color: C.mustardDark }}>✗</span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="font-semibold mt-4">
              {es ? 'SOMOS:' : 'WE ARE:'}
            </p>
            <ul className="space-y-1.5 ml-4">
              {(es ? [
                'Una herramienta de software que ayuda a estructurar y redactar texto',
                'Un asistente de redacción para profesionales ya certificados',
                'Software que NO valida la exactitud clínica de las notas generadas',
              ] : [
                'A software tool that helps structure and draft text',
                'A writing assistant for already-certified professionals',
                'Software that does NOT validate the clinical accuracy of generated notes',
              ]).map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span style={{ color: '#16a34a' }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-10 text-sm leading-relaxed" style={{ color: C.brownSoft }}>

          {/* 1. Aceptación */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: C.brown }}>
              1. {es ? 'Aceptación de los Términos' : 'Acceptance of Terms'}
            </h2>
            <p>
              {es
                ? 'Al crear una cuenta o usar los servicios de Zentyzone ("Servicio", "Plataforma"), aceptas estar vinculado por estos Términos de Servicio. Si no estás de acuerdo con alguna parte de estos términos, no puedes usar el Servicio.'
                : 'By creating an account or using Zentyzone\'s services ("Service", "Platform"), you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use the Service.'}
            </p>
          </section>

          {/* 2. Naturaleza del Servicio */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: C.brown }}>
              2. {es ? 'Naturaleza del Servicio' : 'Nature of the Service'}
            </h2>
            <p className="mb-3">
              {es
                ? 'Zentyzone proporciona herramientas de redacción asistida por inteligencia artificial ("IA") para ayudar a profesionales certificados a estructurar notas clínicas. El Servicio está diseñado exclusivamente como una ayuda para la redacción de texto y no como un sustituto del juicio clínico profesional.'
                : 'Zentyzone provides AI-assisted writing tools to help certified professionals structure clinical notes. The Service is designed exclusively as a writing aid and not as a substitute for professional clinical judgment.'}
            </p>
            <p>
              {es
                ? 'Las notas generadas por la Plataforma son borradores preliminares que requieren revisión, validación y aprobación del profesional antes de cualquier uso clínico, administrativo o legal.'
                : 'Notes generated by the Platform are preliminary drafts that require review, validation, and approval by the professional before any clinical, administrative, or legal use.'}
            </p>
          </section>

          {/* 3. Responsabilidad del Usuario */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: C.brown }}>
              3. {es ? 'Responsabilidad del Usuario' : 'User Responsibility'}
            </h2>
            <p className="mb-4">
              {es
                ? 'Al usar Zentyzone, reconoces y aceptas que eres 100% responsable de:'
                : 'By using Zentyzone, you acknowledge and agree that you are 100% responsible for:'}
            </p>
            <ul className="space-y-2.5 ml-4">
              {(es ? [
                'La veracidad, exactitud y completitud de los datos que ingresas en la Plataforma',
                'Revisar, validar y editar cada nota generada antes de usarla profesionalmente',
                'Firmar y asumir autoría completa de las notas con tu credencial profesional',
                'Cumplir con el BACB Ethics Code y todas las obligaciones de tu certificación',
                'Cumplir con HIPAA, leyes estatales y federales aplicables a tu práctica',
                'Mantener tu certificación profesional activa y vigente',
                'Proteger la información de tus clientes — NO subas nombres completos, fechas exactas de nacimiento, números de Medicaid ni información que permita identificación directa',
                'Cumplir con las políticas de tu agencia, clínica o empleador',
                'Obtener los consentimientos necesarios de tus clientes y tutores según aplique',
              ] : [
                'The truthfulness, accuracy, and completeness of data you enter into the Platform',
                'Reviewing, validating, and editing each generated note before professional use',
                'Signing and assuming full authorship of notes with your professional credential',
                'Complying with the BACB Ethics Code and all obligations of your certification',
                'Complying with HIPAA and applicable state and federal laws governing your practice',
                'Maintaining your active and current professional certification',
                'Protecting your clients\' information — do NOT upload full names, exact dates of birth, Medicaid numbers, or directly identifying information',
                'Complying with the policies of your agency, clinic, or employer',
                'Obtaining necessary consents from clients and guardians as applicable',
              ]).map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0" style={{ color: C.mustardDark }}>•</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* 4. Cuenta */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: C.brown }}>
              4. {es ? 'Cuenta de Usuario' : 'User Account'}
            </h2>
            <ul className="space-y-2.5 ml-4">
              {(es ? [
                'Eres responsable de mantener la confidencialidad de tus credenciales de acceso.',
                'No debes compartir tu cuenta con terceros.',
                'Zentyzone solo permite una sesión activa por cuenta a la vez.',
                'Debes tener al menos 18 años para usar el Servicio.',
                'Debes notificarnos inmediatamente si sospechas uso no autorizado de tu cuenta.',
              ] : [
                'You are responsible for maintaining the confidentiality of your login credentials.',
                'You must not share your account with third parties.',
                'Zentyzone only allows one active session per account at a time.',
                'You must be at least 18 years old to use the Service.',
                'You must notify us immediately if you suspect unauthorized use of your account.',
              ]).map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0" style={{ color: C.mustardDark }}>•</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* 5. Suscripción y Pagos */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: C.brown }}>
              5. {es ? 'Suscripción y Pagos' : 'Subscription and Payments'}
            </h2>
            <ul className="space-y-2.5 ml-4">
              {(es ? [
                'El Servicio ofrece una prueba gratuita de 5 días que requiere tarjeta de crédito o débito válida.',
                'Si no cancelas antes del día 6, se realizará el cobro automático según el plan seleccionado.',
                'Cancelación durante el período de prueba: no se realizará ningún cobro.',
                'Cancelación después del cobro: conservas acceso hasta el fin del período facturado. No se realizan reembolsos del período actual.',
                'Los precios están sujetos a cambios con 30 días de aviso previo por correo electrónico.',
                'Los pagos son procesados por Stripe y están sujetos a sus términos y condiciones.',
              ] : [
                'The Service offers a 5-day free trial that requires a valid credit or debit card.',
                'If you do not cancel before day 6, automatic billing will occur according to your selected plan.',
                'Cancellation during the trial period: no charge will be made.',
                'Cancellation after billing: you retain access until the end of the billing period. No refunds for the current period.',
                'Prices are subject to change with 30 days\' email notice.',
                'Payments are processed by Stripe and subject to their terms and conditions.',
              ]).map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0" style={{ color: C.mustardDark }}>•</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* 6. Uso Aceptable */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: C.brown }}>
              6. {es ? 'Uso Aceptable' : 'Acceptable Use'}
            </h2>
            <p className="mb-3 font-semibold" style={{ color: C.brown }}>
              {es ? 'USO PERMITIDO:' : 'PERMITTED USE:'}
            </p>
            <ul className="space-y-2 ml-4 mb-4">
              {(es ? [
                'Redactar y estructurar notas clínicas profesionales como borrador inicial',
                'Uso por profesionales certificados en el campo de ABA y servicios relacionados',
              ] : [
                'Drafting and structuring professional clinical notes as an initial draft',
                'Use by certified professionals in the field of ABA and related services',
              ]).map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span style={{ color: '#16a34a' }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="mb-3 font-semibold" style={{ color: C.brown }}>
              {es ? 'USO PROHIBIDO:' : 'PROHIBITED USE:'}
            </p>
            <ul className="space-y-2 ml-4">
              {(es ? [
                'Ingresar nombres completos de pacientes, fechas exactas de nacimiento, números de Medicaid u otra PHI (Protected Health Information)',
                'Usar las notas sin revisión y firma profesional previa',
                'Usar el Servicio para fines ilegales o no clínicos',
                'Intentar hacer ingeniería inversa o copiar la tecnología de la Plataforma',
                'Compartir o revender el acceso a tu cuenta',
              ] : [
                'Entering full patient names, exact dates of birth, Medicaid numbers, or other PHI (Protected Health Information)',
                'Using notes without prior professional review and signature',
                'Using the Service for illegal or non-clinical purposes',
                'Attempting to reverse-engineer or copy the Platform\'s technology',
                'Sharing or reselling access to your account',
              ]).map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span style={{ color: '#b4412e' }}>✗</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* 7. Propiedad Intelectual */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: C.brown }}>
              7. {es ? 'Propiedad Intelectual' : 'Intellectual Property'}
            </h2>
            <p className="mb-3">
              {es
                ? 'La Plataforma, su diseño, tecnología, marcas y contenido son propiedad exclusiva de Zentyzone. Queda prohibida su reproducción total o parcial sin autorización escrita.'
                : 'The Platform, its design, technology, trademarks, and content are the exclusive property of Zentyzone. Reproduction in whole or in part without written authorization is prohibited.'}
            </p>
            <p>
              {es
                ? 'Las notas generadas mediante el Servicio, una vez revisadas, editadas y firmadas por el profesional, son propiedad del usuario. Zentyzone no reclama derechos sobre el contenido que generas.'
                : 'Notes generated through the Service, once reviewed, edited, and signed by the professional, are the property of the user. Zentyzone does not claim rights over the content you generate.'}
            </p>
          </section>

          {/* 8. Limitación de Responsabilidad */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: C.brown }}>
              8. {es ? 'Limitación de Responsabilidad' : 'Limitation of Liability'}
            </h2>
            <div
              className="rounded-2xl p-5 mb-4"
              style={{ background: '#fef9ec', border: `2px solid ${C.mustard}` }}
            >
              <div className="flex items-start gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: C.mustardDark }} />
                <p className="font-bold text-sm" style={{ color: C.mustardDark }}>
                  {es ? '⚠️ LIMITACIÓN DE RESPONSABILIDAD' : '⚠️ LIMITATION OF LIABILITY'}
                </p>
              </div>
              <p className="text-sm mb-3" style={{ color: C.brown }}>
                {es ? 'Zentyzone NO es responsable de:' : 'Zentyzone is NOT responsible for:'}
              </p>
              <ul className="space-y-2 text-sm ml-3" style={{ color: C.brown }}>
                {(es ? [
                  'Decisiones clínicas tomadas en base a las notas generadas',
                  'Errores, omisiones o imprecisiones en el contenido generado por IA',
                  'Sanciones a tu certificación profesional, agencia o por parte del estado',
                  'Pérdidas económicas derivadas del uso del Servicio',
                  'Auditorías de seguros que rechacen notas generadas',
                  'Cualquier acción legal en tu contra como profesional',
                  'Interrupciones del Servicio, pérdidas de datos o errores técnicos',
                ] : [
                  'Clinical decisions made based on generated notes',
                  'Errors, omissions, or inaccuracies in AI-generated content',
                  'Sanctions to your professional certification, agency, or from the state',
                  'Economic losses arising from use of the Service',
                  'Insurance audits that reject generated notes',
                  'Any legal action taken against you as a professional',
                  'Service interruptions, data loss, or technical errors',
                ]).map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0" style={{ color: C.mustardDark }}>•</span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm font-semibold" style={{ color: C.brown }}>
                {es
                  ? 'Tu uso del Servicio es bajo tu propio riesgo profesional.'
                  : 'Your use of the Service is at your own professional risk.'}
              </p>
            </div>
          </section>

          {/* 9. Indemnización */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: C.brown }}>
              9. {es ? 'Indemnización' : 'Indemnification'}
            </h2>
            <p>
              {es
                ? 'Aceptas indemnizar, defender y eximir de responsabilidad a Zentyzone, sus directivos, empleados y agentes de cualquier reclamación, responsabilidad, daño, pérdida y gasto (incluyendo honorarios legales razonables) que surja de: (a) tu uso del Servicio; (b) tu incumplimiento de estos Términos; (c) tu violación de derechos de terceros; (d) cualquier nota que generes, uses o entregues a través del Servicio.'
                : 'You agree to indemnify, defend, and hold harmless Zentyzone, its officers, employees, and agents from any claim, liability, damage, loss, and expense (including reasonable legal fees) arising from: (a) your use of the Service; (b) your breach of these Terms; (c) your violation of third-party rights; (d) any note you generate, use, or deliver through the Service.'}
            </p>
          </section>

          {/* 10. Ley aplicable */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: C.brown }}>
              10. {es ? 'Ley Aplicable' : 'Governing Law'}
            </h2>
            <p>
              {es
                ? 'Estos Términos se rigen por las leyes del Estado de Florida, Estados Unidos. Cualquier disputa se resolverá en los tribunales competentes del Estado de Florida.'
                : 'These Terms are governed by the laws of the State of Florida, United States. Any dispute shall be resolved in the competent courts of the State of Florida.'}
            </p>
          </section>

          {/* 11. Cambios */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: C.brown }}>
              11. {es ? 'Cambios en los Términos' : 'Changes to Terms'}
            </h2>
            <p>
              {es
                ? 'Nos reservamos el derecho de modificar estos Términos en cualquier momento. Notificaremos los cambios materiales por correo electrónico con al menos 30 días de anticipación. El uso continuado del Servicio después de la fecha efectiva constituye aceptación de los nuevos términos.'
                : 'We reserve the right to modify these Terms at any time. We will notify you of material changes by email at least 30 days in advance. Continued use of the Service after the effective date constitutes acceptance of the new terms.'}
            </p>
          </section>

          {/* 12. Contacto */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: C.brown }}>
              12. {es ? 'Contacto' : 'Contact'}
            </h2>
            <p>
              {es
                ? 'Si tienes preguntas sobre estos Términos, escríbenos a: '
                : 'If you have questions about these Terms, contact us at: '}
              <a
                href="mailto:support@zentyzone.com"
                style={{ color: C.mustardDark, fontWeight: 600 }}
              >
                support@zentyzone.com
              </a>
            </p>
          </section>
        </div>

        {/* Footer de la página legal */}
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
