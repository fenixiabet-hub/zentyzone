/**
 * Zentyzone — Cliente de Zenty (lado del NAVEGADOR)
 * ------------------------------------------------------------
 * Corre en el navegador, por eso NO contiene ninguna clave secreta.
 * Le envia la conversacion a la funcion serverless /api/generate-note
 * y devuelve la respuesta de Zenty: una PREGUNTA o la NOTA final.
 * ------------------------------------------------------------
 */
import type { NoteType, Language } from '../prompts/zenty-system-prompt';

export type { NoteType, Language };

/** Un mensaje de la conversacion con Zenty. */
export interface ZentyMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** La respuesta de Zenty: o una pregunta, o la nota final. */
export interface ZentyReply {
  /** 'question' = Zenty necesita mas datos. 'note' = nota lista. */
  type: 'question' | 'note';
  /** El texto de la pregunta, o el contenido de la nota. */
  content: string;
}

export interface SendToZentyParams {
  /** El historial completo de la conversacion. */
  messages: ZentyMessage[];
  /** El tipo de nota: 'rbt_daily' | 'soap' | 'bcba_progress'. */
  noteType: NoteType;
  /** El idioma del profesional: 'es' | 'en'. */
  language: Language;
}

/**
 * Envia la conversacion a Zenty y devuelve su respuesta.
 * Lanza un Error con un mensaje claro si algo falla.
 */
export async function sendToZenty(params: SendToZentyParams): Promise<ZentyReply> {
  let response: Response;
  try {
    response = await fetch('/api/generate-note', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
  } catch {
    throw new Error(
      'No se pudo conectar con el servidor. Revisa tu conexion a internet.',
    );
  }

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data &&
      typeof data === 'object' &&
      'error' in data &&
      typeof (data as { error: unknown }).error === 'string'
        ? (data as { error: string }).error
        : `Error del servidor (${response.status}).`;
    throw new Error(message);
  }

  if (
    !data ||
    typeof data !== 'object' ||
    !('type' in data) ||
    !('content' in data) ||
    ((data as { type: unknown }).type !== 'question' &&
      (data as { type: unknown }).type !== 'note') ||
    typeof (data as { content: unknown }).content !== 'string'
  ) {
    throw new Error('La respuesta del servidor no tiene el formato esperado.');
  }

  return {
    type: (data as { type: 'question' | 'note' }).type,
    content: (data as { content: string }).content,
  };
}
