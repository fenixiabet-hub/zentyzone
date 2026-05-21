/**
 * Zentyzone — Cliente de Claude (lado del NAVEGADOR)
 * ------------------------------------------------------------
 * Este archivo SI corre en el navegador, por eso NO contiene
 * ninguna clave secreta. Su unico trabajo es pedirle la nota a
 * la funcion serverless /api/generate-note, que es la que de
 * verdad habla con Claude.
 * ------------------------------------------------------------
 */
import type { NoteType, Language } from '../prompts/zenty-system-prompt';

export type { NoteType, Language };

/** Datos que necesita Zenty para generar una nota. */
export interface GenerateNoteParams {
  /** El texto crudo que escribio el RBT/BCBA sobre la sesion. */
  inputText: string;
  /** El tipo de nota: 'rbt_daily' | 'soap' | 'bcba_progress'. */
  noteType: NoteType;
  /** El idioma de la nota: 'es' | 'en'. */
  language: Language;
}

/**
 * Pide a Zenty que convierta el texto crudo en una nota clinica.
 * Devuelve el texto de la nota generada.
 * Lanza un Error con un mensaje claro si algo falla.
 */
export async function generateNote(
  params: GenerateNoteParams,
): Promise<string> {
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

  // Intentar leer la respuesta como JSON (puede venir vacia si hay error grave).
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
    !('note' in data) ||
    typeof (data as { note: unknown }).note !== 'string'
  ) {
    throw new Error('La respuesta del servidor no tiene el formato esperado.');
  }

  return (data as { note: string }).note;
}
