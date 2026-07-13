export default function initBlogLede() {
    // Automatically extract the first paragraph to use as the blog lede/subtitle
    const articleBody = document.querySelector('.article-section');
    const titleBlock = document.querySelector('.title-block');
    
    if (articleBody && titleBlock && !document.querySelector('.blog-lede')) {
        // Find the first paragraph that actually has text content
        const paragraphs = Array.from(articleBody.querySelectorAll('p'));
        const firstTextP = paragraphs.find(p => p.textContent.trim().length > 0);
        
        if (firstTextP) {
            const lede = document.createElement('p');
            lede.className = 'blog-lede';
            lede.innerHTML = firstTextP.innerHTML;
            titleBlock.appendChild(lede);
            firstTextP.remove(); // Remove from body to prevent duplication
        }
    }
}
