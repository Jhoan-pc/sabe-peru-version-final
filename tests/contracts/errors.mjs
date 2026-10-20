/**
 * RFC 9457 Problem Details & Toast Notification Contract
 * Formal SSOT: specs/openapi.yaml lines 459-487, specs/SDD_MASTER.md §3.2 (6), PROJECT.md Interface Contract #4
 */

export const RFC_9457_CONTENT_TYPE = 'application/problem+json';

/**
 * Creates and validates an RFC 9457 Problem Details structure.
 * @param {object} params
 * @param {string} params.type - Absolute URI identifying problem type
 * @param {string} params.title - Short, human-readable summary
 * @param {number} params.status - HTTP status code
 * @param {string} [params.detail] - Human-readable explanation specific to occurrence
 * @param {string} [params.instance] - URI reference identifying specific occurrence
 * @param {Array<{ name: string, reason: string }>} [params.invalid_params]
 * @returns {object} validated Problem Details object
 */
export function createProblemDetails({ type, title, status, detail, instance, invalid_params }) {
  if (!type || typeof type !== 'string') {
    throw new Error('ProblemDetails requires a string "type" URI');
  }
  if (!title || typeof title !== 'string') {
    throw new Error('ProblemDetails requires a string "title"');
  }
  if (typeof status !== 'number' || !Number.isInteger(status) || status < 400 || status > 599) {
    throw new Error('ProblemDetails requires an HTTP error status code (400-599)');
  }

  const problem = {
    type,
    title,
    status
  };

  if (detail && typeof detail === 'string') problem.detail = detail;
  if (instance && typeof instance === 'string') problem.instance = instance;
  if (Array.isArray(invalid_params)) problem.invalid_params = invalid_params;

  return Object.freeze(problem);
}

/**
 * Renders an RFC 9457 Problem Details object into the Quiet Luxury Toast UI structure.
 * Native window.alert() is strictly forbidden.
 * @param {object} problem
 * @returns {string} HTML markup for toast element
 */
export function renderProblemToastHtml(problem) {
  const icon = problem.status >= 500 ? '⚠️' : 'ℹ️';
  const detailHtml = problem.detail
    ? `<div class="toast-detail">${escapeHtml(problem.detail)}</div>`
    : '';

  return `<div class="toast error rfc-9457" role="alert" data-status="${problem.status}">
    <span class="toast-icon">${icon}</span>
    <div class="toast-content">
      <div class="toast-title">${escapeHtml(problem.title)}</div>
      ${detailHtml}
    </div>
  </div>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
