import sanitizeHtml from "sanitize-html";

export function sanitizeContent(raw = "") {
    return sanitizeHtml(raw, {
        allowedTags: ["b", "i", "strong", "em", "u", "a", "br", "ul", "ol", "li"],
        allowedAttributes: {
            a: ["href", "target"]
        },
        allowedSchemes: ["http", "https", "mailto"]
    });
}
