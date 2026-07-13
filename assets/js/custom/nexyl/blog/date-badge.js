/* ─── Relative date helper ─── */
function timeAgo(dateString) {
    if (!dateString) return '';
    // Handle ordinal suffixes (e.g. 12th)
    const cleanDate = dateString.replace(/(\d+)(st|nd|rd|th)/, '$1');
    const date = new Date(cleanDate);
    if (isNaN(date.getTime())) return dateString;
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'Just now';
    const intervals = [
        { label: 'year', seconds: 31536000 },
        { label: 'month', seconds: 2592000 },
        { label: 'week', seconds: 604800 },
        { label: 'day', seconds: 86400 },
        { label: 'hour', seconds: 3600 },
        { label: 'minute', seconds: 60 }
    ];
    for (let i = 0; i < intervals.length; i++) {
        const count = Math.floor(seconds / intervals[i].seconds);
        if (count >= 1) return count + ' ' + intervals[i].label + (count > 1 ? 's' : '') + ' ago';
    }
    return dateString;
}

export function initRelativeDates() {
    document.querySelectorAll('.nx-blog-date').forEach(el => {
        const rawDate = el.getAttribute('data-blog-date');
        if (rawDate) {
            const relative = timeAgo(rawDate);
            if (relative !== rawDate) {
                el.textContent = relative;
            }
        }
    });
}

export function initBlogBadges() {
    document.querySelectorAll('.nx-blog-badge').forEach(el => {
        const tagsString = el.getAttribute('data-tags');
        if (tagsString) {
            // Split tags string by comma and trim whitespace
            const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
            
            // Check if any tag contains "min read"
            const minReadTag = tags.find(tag => tag.toLowerCase().includes('min read'));
            
            if (minReadTag) {
                el.textContent = minReadTag;
            } else {
                el.textContent = 'Blog';
            }
        }
    });
}
