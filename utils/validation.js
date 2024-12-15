/**
 * Checks if the request body contains any unexpected attributes.
 *
 * @param {Record<string, any>} body - The request body to check.
 * @param {Array<string>} allowedAttributes - The list of allowed attributes.
 * @returns {ValidationResult} - The validation result.
 */
const validateUnexpectedAttributes = (body, allowedAttributes) => {
  const invalidAttributes = Object.keys(body).filter((key) => !allowedAttributes.includes(key));
  if (invalidAttributes.length > 0) {
    return { valid: false, err: `Unexpected attribute(s): ${invalidAttributes.join(', ')}` };
  }
  return { valid: true };
};

export default validateUnexpectedAttributes;
