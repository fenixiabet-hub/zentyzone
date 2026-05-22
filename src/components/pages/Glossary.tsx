/**
 * Glossary — Glosario ABA
 * 35 términos clínicos con definición + ejemplo en nota, en ES/EN
 * Búsqueda en tiempo real, agrupado por letra
 */
import { useState, useMemo } from 'react';
import { Search, X, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { C } from '../../theme';
import { tm } from '../../translations/menu';
import type { Lang } from '../../translations';

interface Term {
  term: string;
  termEs?: string;
  full: string;
  fullEs?: string;
  defEn: string;
  defEs: string;
  exEn: string;
  exEs: string;
}

const TERMS: Term[] = [
  {
    term: 'ABC',
    full: 'Antecedent–Behavior–Consequence',
    defEn: 'Behavioral analysis framework that describes the antecedent (what occurs before a behavior), the observed behavior, and the consequence (what occurs after). Used to identify the function of behavior.',
    defEs: 'Marco de análisis conductual que describe el antecedente (lo que ocurre antes), la conducta observada y la consecuencia (lo que ocurre después). Se usa para identificar la función de la conducta.',
    exEn: '"ABC data collected: A — therapist presented SD (item name); B — client pointed to correct item; C — token delivered."',
    exEs: '"Se registraron datos ABC: A — terapeuta presentó SD (nombre del ítem); C — cliente señaló ítem correcto; C — entrega de token."',
  },
  {
    term: 'Antecedent',
    termEs: 'Antecedente',
    full: 'Antecedent Stimulus',
    defEn: 'Any stimulus or event occurring immediately before a behavior that may influence its likelihood of occurrence. Antecedents include SDs, establishing operations, and environmental conditions.',
    defEs: 'Cualquier estímulo o evento que ocurre inmediatamente antes de una conducta y puede influir en su probabilidad de ocurrencia. Incluye SDs, operaciones de establecimiento y condiciones ambientales.',
    exEn: '"Antecedent consisted of verbal SD "touch the ball" presented at a distance of 3 feet."',
    exEs: '"El antecedente consistió en el SD verbal "toca la pelota" presentado a 90 cm de distancia."',
  },
  {
    term: 'BCBA',
    full: 'Board Certified Behavior Analyst',
    defEn: 'BACB-certified professional who designs ABA programs, conducts functional behavior assessments, and makes all clinical decisions. The RBT implements the programs under BCBA supervision.',
    defEs: 'Profesional certificado por el BACB que diseña programas de ABA, realiza evaluaciones funcionales y toma todas las decisiones clínicas. El RBT implementa los programas bajo su supervisión.',
    exEn: '"Program reviewed and updated by supervising BCBA. Current targets implemented as specified in the treatment plan."',
    exEs: '"Programa revisado y actualizado por el BCBA supervisor. Objetivos actuales implementados según el plan de tratamiento."',
  },
  {
    term: 'Behavior Momentum',
    full: 'Behavioral Momentum',
    defEn: 'Strategy of presenting a series of high-probability (high-p) requests before a low-probability (low-p) request to increase compliance and reduce task refusal.',
    defEs: 'Estrategia que consiste en presentar una serie de peticiones de alta probabilidad (high-p) antes de una petición de baja probabilidad (low-p) para aumentar la cooperación.',
    exEn: '"Behavior momentum used prior to tooth brushing: presented 3 high-p requests (give me five, touch head, stand up) before initiating the low-p target."',
    exEs: '"Se usó behavior momentum antes del cepillado: se presentaron 3 peticiones high-p (choca esos cinco, toca la cabeza, levántate) antes del objetivo low-p."',
  },
  {
    term: 'Chaining',
    full: 'Behavior Chaining',
    defEn: 'Teaching procedure that links individual steps of a task analysis into a complete sequence. Can be forward (first step first), backward (last step first), or total task (all steps every trial).',
    defEs: 'Procedimiento de enseñanza que encadena pasos individuales de un análisis de tareas en una secuencia completa. Puede ser hacia adelante, hacia atrás o por tarea completa.',
    exEn: '"Backward chaining used for handwashing. Client independently completed steps 6–8; RBT assisted steps 1–5."',
    exEs: '"Se usó backward chaining para lavado de manos. El cliente completó pasos 6–8 de forma independiente; el RBT asistió en pasos 1–5."',
  },
  {
    term: 'DRA',
    full: 'Differential Reinforcement of Alternative Behaviors',
    defEn: 'Procedure in which an appropriate alternative behavior (topographically different, same function) is reinforced while the problem behavior is placed on extinction.',
    defEs: 'Procedimiento en el que se refuerza una conducta alternativa apropiada (diferente topografía, misma función) y la conducta problema se pone en extinción.',
    exEn: '"DRA implemented: requesting a break verbally reinforced; dropping to floor placed on extinction."',
    exEs: '"Se implementó DRA: solicitar un descanso verbalmente fue reforzado; tirarse al suelo se puso en extinción."',
  },
  {
    term: 'DRI',
    full: 'Differential Reinforcement of Incompatible Behaviors',
    defEn: 'Procedure in which a behavior physically incompatible with the problem behavior is reinforced. Both behaviors cannot occur simultaneously (e.g., hands in lap vs. self-injury).',
    defEs: 'Procedimiento en el que se refuerza una conducta físicamente incompatible con la conducta problema. Ambas no pueden ocurrir al mismo tiempo (ej: manos en el regazo vs. autolesión).',
    exEn: '"DRI applied: hands-in-lap behavior reinforced with preferred item every 3 min when maintained."',
    exEs: '"Se aplicó DRI: conducta de manos en el regazo reforzada con ítem preferido cada 3 min cuando se mantenía."',
  },
  {
    term: 'DRO',
    full: 'Differential Reinforcement of Other Behaviors',
    defEn: 'Procedure in which reinforcement is delivered for the absence of the problem behavior during a specified interval. The client earns reinforcement by not engaging in the target behavior.',
    defEs: 'Procedimiento en el que se entrega reforzamiento por la ausencia de la conducta problema durante un intervalo determinado. El cliente gana el reforzador por no exhibir la conducta objetivo.',
    exEn: '"DRO 5-min interval implemented. Client earned token 4/6 intervals for absence of hitting."',
    exEs: '"Se implementó DRO de intervalos de 5 min. El cliente ganó token en 4/6 intervalos por ausencia de golpes."',
  },
  {
    term: 'Echoic',
    full: 'Echoic (Verbal Operant)',
    defEn: 'Verbal operant in which the speaker repeats a vocal model produced by another person. Controlled by a verbal stimulus of the same topographic form (hearing "ball" → saying "ball").',
    defEs: 'Operante verbal en la que el hablante repite un modelo vocal producido por otra persona. Controlada por un estímulo verbal de la misma forma topográfica (oír "pelota" → decir "pelota").',
    exEn: '"Echoic training conducted: RBT modeled target word, client echoed correctly on 7/10 trials."',
    exEs: '"Se realizó entrenamiento de echoics: el RBT modeló la palabra objetivo, el cliente la repitió correctamente en 7/10 ensayos."',
  },
  {
    term: 'Elopement',
    full: 'Elopement',
    defEn: 'Behavior in which the client leaves the designated safe area or boundaries without permission. Often a priority safety behavior requiring immediate protocol implementation.',
    defEs: 'Conducta en la que el cliente abandona el área segura o los límites designados sin permiso. Frecuentemente es una conducta de seguridad prioritaria que requiere implementación inmediata de protocolo.',
    exEn: '"Elopement occurred once (2:14 PM); client was safely redirected within 8 seconds per safety protocol."',
    exEs: '"Se produjo un episodio de elopement (2:14 PM); el cliente fue redirigido de forma segura en 8 segundos según el protocolo de seguridad."',
  },
  {
    term: 'Extinction',
    termEs: 'Extinción',
    full: 'Extinction',
    defEn: 'Procedure in which the reinforcer that was maintaining a problem behavior is withheld. May produce an initial extinction burst. Must be implemented consistently and as specified by the BCBA.',
    defEs: 'Procedimiento en el que se retira el reforzador que mantenía la conducta problema. Puede producir un burst de extinción inicial. Debe implementarse de forma consistente y según lo especificado por el BCBA.',
    exEn: '"Extinction maintained throughout session. Escape-maintained behaviors ignored; no break provided contingent on refusal."',
    exEs: '"Extinción mantenida durante la sesión. Las conductas mantenidas por escape fueron ignoradas; no se otorgó descanso contingente al rechazo."',
  },
  {
    term: 'Fading',
    full: 'Stimulus Fading / Prompt Fading',
    defEn: 'Gradual reduction of prompts or training-stimulus features to transfer behavioral control to the natural antecedent stimulus. Goal is independent responding.',
    defEs: 'Reducción gradual de ayudas (prompts) o características del estímulo de entrenamiento para transferir el control al estímulo natural. El objetivo es la respuesta independiente.',
    exEn: '"Prompt fading applied: gestural prompt faded to independent over 3 consecutive sessions at 80%+ criterion."',
    exEs: '"Se aplicó fading de ayudas: el prompt gestual fue desvanecido hasta independiente durante 3 sesiones consecutivas con criterio ≥80%."',
  },
  {
    term: 'FCT',
    full: 'Functional Communication Training',
    defEn: 'DRA-based intervention in which the client is taught a functionally equivalent communicative behavior (e.g., signing "break," tapping a card) to replace the problem behavior.',
    defEs: 'Intervención basada en DRA en la que se enseña al cliente una conducta comunicativa funcionalmente equivalente (ej: signar "descanso", tocar una tarjeta) para reemplazar la conducta problema.',
    exEn: '"FCT implemented: client prompted to tap break card; behavior honored immediately. Problem behavior reduced from 8 to 2 occurrences."',
    exEs: '"Se implementó FCT: cliente incitado a tocar la tarjeta de descanso; conducta honrada de inmediato. La conducta problema se redujo de 8 a 2 ocurrencias."',
  },
  {
    term: 'Generalization',
    termEs: 'Generalización',
    full: 'Stimulus Generalization',
    defEn: 'Occurrence of a learned behavior in the presence of stimuli or contexts not present during training. A key goal of ABA is programming for generalization across settings, people, and materials.',
    defEs: 'Ocurrencia de una conducta aprendida en presencia de estímulos o contextos no presentes durante el entrenamiento. Un objetivo clave del ABA es programar para la generalización a través de contextos, personas y materiales.',
    exEn: '"Generalization probed across 3 settings: client demonstrated target skill in clinic, home, and community at 85%+ accuracy."',
    exEs: '"Se realizaron sondeos de generalización en 3 contextos: el cliente demostró la habilidad objetivo en clínica, hogar y comunidad con precisión ≥85%."',
  },
  {
    term: 'Least-to-most prompt',
    full: 'Least-to-Most Prompt Hierarchy',
    defEn: 'Prompt hierarchy starting with the least intrusive prompt level (e.g., verbal) and escalating if the client does not respond correctly within the allotted time.',
    defEs: 'Jerarquía de ayudas que comienza con el nivel menos intrusivo (ej: verbal) y escala si el cliente no responde correctamente dentro del tiempo establecido.',
    exEn: '"Least-to-most hierarchy used: verbal prompt (3 s wait), then gestural, then partial physical as needed."',
    exEs: '"Se usó jerarquía de menos a más: prompt verbal (espera 3 s), luego gestual, luego físico parcial según necesidad."',
  },
  {
    term: 'Listener Responding',
    full: 'Listener Responding (Receptive Language)',
    defEn: 'Non-verbal responses to verbal stimuli (e.g., pointing to a named object, following instructions). A verbal operant controlled by the verbal SD of another speaker.',
    defEs: 'Respuestas no verbales a estímulos verbales (ej: señalar un objeto nombrado, seguir instrucciones). Operante verbal controlada por el SD verbal de otro hablante.',
    exEn: '"Listener responding targets: client correctly identified 6/8 items by name across 3 different arrays."',
    exEs: '"Objetivos de listener responding: el cliente identificó correctamente 6/8 ítems por nombre en 3 arrays diferentes."',
  },
  {
    term: 'Mand',
    full: 'Mand (Verbal Operant)',
    defEn: 'Verbal operant controlled by a motivating operation (deprivation or aversive stimulation) where the speaker requests something. The reinforcer is specific and directly related to the mand.',
    defEs: 'Operante verbal controlada por una operación motivacional (privación o estimulación aversiva) en la que el hablante solicita algo. El reforzador es específico y directamente relacionado con el mand.',
    exEn: '"Mand training: client independently requested "cookie" during snack time on 5/6 opportunities (one prompt needed)."',
    exEs: '"Entrenamiento de mands: el cliente solicitó "galleta" de forma independiente en 5/6 oportunidades durante la merienda (un prompt necesario)."',
  },
  {
    term: 'Manding',
    full: 'Manding (Training Procedure)',
    defEn: 'Procedure for teaching mands: establish a motivating operation, present SD, prompt the request if needed, and immediately deliver the requested item.',
    defEs: 'Procedimiento de entrenamiento de mands: establecer operación motivacional, presentar SD, incitar la petición si es necesario y entregar inmediatamente el ítem solicitado.',
    exEn: '"Manding procedure followed throughout: MO established by removing toy, SD presented, client manded, item delivered within 2 s."',
    exEs: '"Procedimiento de manding seguido durante la sesión: OM establecida retirando el juguete, SD presentado, cliente mand-ó, ítem entregado en ≤2 s."',
  },
  {
    term: 'Matching',
    full: 'Matching-to-Sample',
    defEn: 'Task in which the client selects a comparison stimulus that matches the sample. Can be identity matching (identical items), arbitrary matching, or symbolic matching (e.g., picture to word).',
    defEs: 'Tarea en la que el cliente selecciona un estímulo de comparación que coincide con la muestra. Puede ser de identidad (ítems idénticos), arbitraria o simbólica (ej: imagen a palabra).',
    exEn: '"Identity matching: client matched identical objects with 90% accuracy across 2 sets; moving to symbolic matching next session."',
    exEs: '"Matching de identidad: el cliente emparejó objetos idénticos con 90% de precisión en 2 sets; se avanzará a matching simbólico en la próxima sesión."',
  },
  {
    term: 'Most-to-least prompt',
    full: 'Most-to-Least Prompt Hierarchy',
    defEn: 'Prompt hierarchy starting with the most intrusive prompt level (e.g., full physical) and systematically reducing toward independence as the client meets mastery criteria.',
    defEs: 'Jerarquía de ayudas que inicia con el nivel más intrusivo (ej: físico total) y se reduce sistemáticamente hacia la independencia a medida que el cliente alcanza los criterios de dominio.',
    exEn: '"Most-to-least hierarchy applied to teeth brushing: moved from full physical to partial physical after 3 sessions at 80%."',
    exEs: '"Jerarquía de más a menos aplicada al cepillado: se pasó de físico total a físico parcial tras 3 sesiones al 80%."',
  },
  {
    term: 'NET',
    full: 'Natural Environment Teaching',
    defEn: 'Incidental teaching approach occurring in the client\'s natural environment, leveraging natural motivating operations and spontaneous opportunities to practice language and skill targets.',
    defEs: 'Enfoque de enseñanza incidental en el entorno natural del cliente, aprovechando las operaciones motivacionales naturales y las oportunidades espontáneas para practicar objetivos de lenguaje y habilidades.',
    exEn: '"NET conducted during outdoor play: 12 manding opportunities captured; client manded for bubbles, ball, and swing independently."',
    exEs: '"NET realizado durante juego al aire libre: 12 oportunidades de mand capturadas; el cliente solicitó burbujas, pelota y columpio de forma independiente."',
  },
  {
    term: 'Premack Principle',
    full: 'Premack Principle (Grandma\'s Rule)',
    defEn: 'A high-probability behavior can be used to reinforce a low-probability behavior ("First work, then play"). Used when tangible reinforcers are not available or appropriate.',
    defEs: 'Una conducta de alta probabilidad puede usarse para reforzar una conducta de baja probabilidad ("Primero el trabajo, luego el juego"). Se usa cuando los reforzadores tangibles no están disponibles o no son apropiados.',
    exEn: '"Premack principle applied: "First finish the puzzle, then you can watch the video." Client completed puzzle with 1 verbal prompt."',
    exEs: '"Se aplicó el principio de Premack: "Primero termina el rompecabezas, luego puedes ver el video." El cliente completó el rompecabezas con 1 prompt verbal."',
  },
  {
    term: 'Problem Behavior',
    termEs: 'Comportamiento Problema',
    full: 'Problem Behavior / Challenging Behavior',
    defEn: 'Any behavior that interferes with the client\'s learning, safety, or social integration. Function is always determined by the BCBA via FBA, not assumed.',
    defEs: 'Cualquier conducta que interfiere con el aprendizaje, la seguridad o la integración social del cliente. La función siempre la determina el BCBA mediante FBA, no se asume.',
    exEn: '"Problem behavior (head banging) occurred 3 times during session. Data recorded per protocol; reported to BCBA supervisor."',
    exEs: '"La conducta problema (golpearse la cabeza) ocurrió 3 veces durante la sesión. Datos registrados según protocolo; reportado al BCBA supervisor."',
  },
  {
    term: 'Prompt',
    full: 'Prompt (Antecedent Stimulus)',
    defEn: 'Additional antecedent stimulus that increases the probability of a correct response. Types: verbal (VP), gestural (GP), model (MP), partial physical (PPP), full physical (FPP).',
    defEs: 'Estímulo antecedente adicional que aumenta la probabilidad de una respuesta correcta. Tipos: verbal (VP), gestual (GP), modelo (MP), físico parcial (PPP), físico total (FPP).',
    exEn: '"Gestural prompt provided (pointing to correct response) on 4/10 trials; 6/10 independent. Fading to no prompt next session."',
    exEs: '"Se proporcionó prompt gestual (señalar la respuesta correcta) en 4/10 ensayos; 6/10 independientes. Se desvanecerá a sin prompt en la próxima sesión."',
  },
  {
    term: 'RBT',
    full: 'Registered Behavior Technician',
    defEn: 'BACB-certified paraprofessional who directly implements ABA programs as specified by the supervising BCBA. Responsible for accurate data collection and following the behavior intervention plan.',
    defEs: 'Paraprofesional certificado por el BACB que implementa directamente los programas de ABA según lo especificado por el BCBA supervisor. Responsable de la recolección de datos y del seguimiento del plan de intervención conductual.',
    exEn: '"Session conducted by RBT under supervision of [BCBA name]. All programs implemented as written."',
    exEs: '"Sesión conducida por RBT bajo la supervisión de [nombre del BCBA]. Todos los programas implementados según lo escrito."',
  },
  {
    term: 'Redirection',
    full: 'Redirection',
    defEn: 'Antecedent or consequent strategy of redirecting the client toward an appropriate alternative behavior when a problem behavior is imminent or occurring.',
    defEs: 'Estrategia antecedente o consecuente de redirigir al cliente hacia una conducta alternativa apropiada cuando una conducta problema es inminente o está ocurriendo.',
    exEn: '"Redirection used when client began grabbing peer\'s materials; prompted to request turn-taking instead."',
    exEs: '"Se usó redirección cuando el cliente comenzó a tomar los materiales del compañero; se le indicó solicitar el turno en su lugar."',
  },
  {
    term: 'Reinforcer',
    termEs: 'Reforzador',
    full: 'Reinforcer',
    defEn: 'Stimulus whose delivery (positive reinforcement) or removal (negative reinforcement) increases the future probability of the behavior it followed. Reinforcer effectiveness may vary by session.',
    defEs: 'Estímulo cuya entrega (reforzamiento positivo) o remoción (reforzamiento negativo) aumenta la probabilidad futura de la conducta que le precedió. La efectividad del reforzador puede variar según la sesión.',
    exEn: '"Primary reinforcer (crackers) used during DTT. Reinforcer satiation observed after 20 min; switched to iPad as reinforcer."',
    exEs: '"Se usó reforzador primario (galletas) durante DTT. Se observó saciación del reforzador a los 20 min; se cambió a iPad como reforzador."',
  },
  {
    term: 'SD',
    full: 'Discriminative Stimulus (Estímulo Discriminativo)',
    defEn: 'Stimulus in whose presence a behavior has been reinforced; signals to the client that a reinforcer is available for a correct response. Distinct from the SΔ (no reinforcement available).',
    defEs: 'Estímulo en cuya presencia una conducta ha sido reforzada; señala al cliente que un reforzador está disponible para una respuesta correcta. Diferente al SΔ (sin reforzamiento disponible).',
    exEn: '"SD "touch your nose" presented in clear, neutral tone; 3 s wait time allowed before delivering prompt."',
    exEs: '"SD "toca tu nariz" presentado en tono claro y neutro; se permitió un tiempo de espera de 3 s antes de entregar el prompt."',
  },
  {
    term: 'Shaping',
    full: 'Shaping (Successive Approximations)',
    defEn: 'Differential reinforcement of successive approximations toward a terminal behavior not yet in the client\'s repertoire. Each step is reinforced until mastery before moving to the next.',
    defEs: 'Reforzamiento diferencial de aproximaciones sucesivas hacia una conducta terminal que aún no está en el repertorio del cliente. Cada paso se refuerza hasta el dominio antes de avanzar al siguiente.',
    exEn: '"Shaping used for greeting: currently reinforcing any vocalization; criterion for next step is approximation of "hi."',
    exEs: '"Se usó shaping para el saludo: actualmente se refuerza cualquier vocalización; el criterio para el siguiente paso es una aproximación a "hola"."',
  },
  {
    term: 'Stereotypical Behaviors',
    full: 'Stereotypy / Stereotypical Behaviors',
    defEn: 'Repetitive behaviors with no apparent social function (e.g., hand flapping, spinning objects, rocking). Classified as automatically reinforced. Function assessment by BCBA required before any intervention.',
    defEs: 'Conductas repetitivas sin función social aparente (ej: flapping de manos, girar objetos, mecerse). Se clasifican como automáticamente reforzadas. Se requiere evaluación de función por el BCBA antes de cualquier intervención.',
    exEn: '"Hand flapping (stereotypy) observed during unstructured time. No intervention applied per BCBA instructions; frequency recorded only."',
    exEs: '"Se observó flapping de manos (estereotipia) durante el tiempo no estructurado. No se aplicó intervención según instrucciones del BCBA; solo se registró la frecuencia."',
  },
  {
    term: 'Tact',
    full: 'Tact (Verbal Operant)',
    defEn: 'Verbal operant controlled by a nonverbal environmental stimulus (object, action, or property) that evokes a verbal label. The "naming" verbal operant — e.g., seeing a dog and saying "dog."',
    defEs: 'Operante verbal controlada por un estímulo ambiental no verbal (objeto, acción o propiedad) que evoca una etiqueta verbal. El operante verbal de "nombrar" — ej: ver un perro y decir "perro".',
    exEn: '"Tact training: client labeled 8/10 common objects independently across 2 novel arrays without VP."',
    exEs: '"Entrenamiento de tacts: el cliente etiquetó 8/10 objetos comunes de forma independiente en 2 arrays novedosos sin VP."',
  },
  {
    term: 'Tantrums',
    full: 'Tantrum / Emotional Outburst',
    defEn: 'Behavioral episode that may include crying, screaming, dropping to floor, or other intense behaviors. Function (attention, escape, access, automatic) must be determined by BCBA via FBA.',
    defEs: 'Episodio conductual que puede incluir llanto, gritos, caída al suelo u otras conductas intensas. La función (atención, escape, acceso, automática) debe ser determinada por el BCBA mediante FBA.',
    exEn: '"Tantrum episode occurred at 3:10 PM (duration 4 min) following transition demand. Data collected per behavior plan."',
    exEs: '"Episodio de berrinche ocurrió a las 3:10 PM (duración 4 min) tras una demanda de transición. Datos recolectados según el plan de conducta."',
  },
  {
    term: 'Task Refusal',
    full: 'Task Refusal',
    defEn: 'Behavior in which the client refuses to initiate or continue an assigned task, often escape-maintained. May manifest as verbal refusal, dropping materials, or problem behavior.',
    defEs: 'Conducta en la que el cliente se niega a iniciar o continuar una tarea asignada, frecuentemente mantenida por escape. Puede manifestarse como negativa verbal, dejar caer materiales o conducta problema.',
    exEn: '"Task refusal occurred 5 times during tabletop tasks; escape extinction maintained, task re-presented each time per plan."',
    exEs: '"El rechazo de tarea ocurrió 5 veces durante actividades en mesa; extinción de escape mantenida, tarea re-presentada cada vez según el plan."',
  },
  {
    term: 'Task Re-presentation',
    full: 'Task Re-presentation (Error Correction)',
    defEn: 'Error correction procedure in which the same SD is re-presented after an incorrect or absent response, allowing the client another opportunity to respond correctly, often with a prompt.',
    defEs: 'Procedimiento de corrección de errores en el que el mismo SD se presenta nuevamente tras una respuesta incorrecta o ausente, dando al cliente otra oportunidad de responder correctamente, frecuentemente con un prompt.',
    exEn: '"Error correction applied: following incorrect response, model prompt delivered, task re-presented, and correct response reinforced."',
    exEs: '"Se aplicó corrección de errores: tras respuesta incorrecta, se entregó prompt de modelo, se re-presentó la tarea y se reforzó la respuesta correcta."',
  },
  {
    term: 'Topography',
    termEs: 'Topografía',
    full: 'Response Topography',
    defEn: 'The physical form or observable characteristics of a behavior (e.g., kicking vs. pushing). Two behaviors can share the same function but have different topographies.',
    defEs: 'La forma física o características observables de una conducta (ej: patear versus empujar). Dos conductas pueden compartir la misma función pero tener topografías diferentes.',
    exEn: '"Problem behavior topography: open-hand hitting directed at adults. Differentiated from pinching (separate data sheet)."',
    exEs: '"Topografía de la conducta problema: golpes con mano abierta dirigidos a adultos. Diferenciada de pellizcos (hoja de datos separada)."',
  },
];

interface GlossaryProps {
  lang: Lang;
}

export function Glossary({ lang }: GlossaryProps) {
  const M = tm[lang];
  const es = lang === 'es';

  const [search, setSearch]   = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return TERMS;
    const q = search.toLowerCase();
    return TERMS.filter(
      (t) =>
        t.term.toLowerCase().includes(q) ||
        (t.termEs?.toLowerCase().includes(q) ?? false) ||
        t.full.toLowerCase().includes(q) ||
        t.defEn.toLowerCase().includes(q) ||
        t.defEs.toLowerCase().includes(q),
    );
  }, [search]);

  // Agrupar por primera letra
  const grouped = useMemo(() => {
    const map = new Map<string, Term[]>();
    for (const term of filtered) {
      const letter = term.term[0].toUpperCase();
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter)!.push(term);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const termLabel = (t: Term) => {
    if (es && t.termEs) return `${t.termEs} / ${t.term}`;
    return t.term;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1
          className="text-2xl lg:text-3xl tracking-tight font-bold"
          style={{ color: C.brown, letterSpacing: '-0.02em' }}
        >
          {M.glossaryTitle}
        </h1>
        <p className="mt-1 text-sm" style={{ color: C.brownSoft }}>
          {TERMS.length} {es ? 'términos clínicos ABA' : 'ABA clinical terms'}
        </p>
      </div>

      {/* Búsqueda */}
      <div className="relative max-w-md">
        <Search
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: C.brownLight }}
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={M.glossarySearch}
          className="w-full pl-10 pr-9 py-2.5 rounded-2xl focus:outline-none transition-all text-sm"
          style={{ background: 'white', border: `1.5px solid ${C.creamWarm}`, color: C.brown }}
          onFocus={(e) => (e.target.style.borderColor = C.mustard)}
          onBlur={(e)  => (e.target.style.borderColor = C.creamWarm)}
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2">
            <X className="w-3.5 h-3.5" style={{ color: C.brownLight }} />
          </button>
        )}
      </div>

      {/* Lista */}
      {grouped.length === 0 ? (
        <div
          className="rounded-[2rem] p-12 text-center"
          style={{ background: 'white', boxShadow: `0 4px 20px ${C.mustardDark}10` }}
        >
          <BookOpen className="w-8 h-8 mx-auto mb-3" style={{ color: C.brownLight }} strokeWidth={1.5} />
          <p className="text-sm" style={{ color: C.brownSoft }}>{M.glossaryEmpty}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([letter, terms]) => (
            <div key={letter}>
              {/* Letra de sección */}
              <div className="flex items-center gap-3 mb-3">
                <span
                  className="text-2xl font-bold"
                  style={{ color: C.mustardDark, fontFamily: "'Caveat', cursive", lineHeight: 1 }}
                >
                  {letter}
                </span>
                <div className="flex-1 h-px" style={{ background: C.creamWarm }} />
              </div>

              {/* Términos del grupo */}
              <div className="space-y-2">
                {terms.map((term) => {
                  const key = term.term;
                  const isOpen = expanded.has(key);
                  return (
                    <div
                      key={key}
                      className="rounded-[1.5rem] overflow-hidden"
                      style={{ background: 'white', boxShadow: `0 2px 12px ${C.mustardDark}0a` }}
                    >
                      {/* Header del término (siempre visible) */}
                      <button
                        onClick={() => toggle(key)}
                        className="w-full flex items-center justify-between px-5 py-4 text-left transition-all"
                        style={{ background: isOpen ? C.mustardSoft : 'transparent' }}
                        onMouseEnter={(e) => { if (!isOpen) e.currentTarget.style.background = C.creamSoft; }}
                        onMouseLeave={(e) => { if (!isOpen) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div>
                          <span
                            className="text-base font-bold"
                            style={{ color: isOpen ? C.mustardDark : C.brown }}
                          >
                            {termLabel(term)}
                          </span>
                          <span
                            className="ml-2 text-sm italic"
                            style={{ color: isOpen ? C.mustardDark : C.brownSoft, opacity: 0.8 }}
                          >
                            {term.full}
                          </span>
                        </div>
                        {isOpen
                          ? <ChevronUp className="w-4 h-4 shrink-0" style={{ color: C.mustardDark }} />
                          : <ChevronDown className="w-4 h-4 shrink-0" style={{ color: C.brownLight }} />}
                      </button>

                      {/* Contenido expandido */}
                      {isOpen && (
                        <div className="px-5 pb-5 space-y-4" style={{ borderTop: `1px solid ${C.creamSoft}` }}>
                          <p className="text-sm leading-relaxed pt-4" style={{ color: C.brown }}>
                            {es ? term.defEs : term.defEn}
                          </p>
                          <div className="rounded-xl p-4" style={{ background: C.cream }}>
                            <p
                              className="text-[10px] uppercase tracking-wider font-semibold mb-2"
                              style={{ color: C.brownLight }}
                            >
                              {M.glossaryExample}
                            </p>
                            <p
                              className="text-xs leading-relaxed italic"
                              style={{ color: C.brownSoft, fontFamily: "'JetBrains Mono', monospace" }}
                            >
                              {es ? term.exEs : term.exEn}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
