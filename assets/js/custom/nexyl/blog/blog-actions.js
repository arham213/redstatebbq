export default function initBlogActions() {
    // Share Dropdown Toggle
    const shareBtns = document.querySelectorAll('.nx-share-btn');
    shareBtns.forEach(shareBtn => {
        const shareDropdown = shareBtn.nextElementSibling;
        if (shareDropdown && shareDropdown.classList.contains('nx-share-dropdown')) {
            shareBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Close other open dropdowns
                document.querySelectorAll('.nx-share-dropdown.is-open').forEach(dd => {
                    if (dd !== shareDropdown) dd.classList.remove('is-open');
                });
                
                // Dynamic positioning
                const rect = shareBtn.getBoundingClientRect();
                const windowWidth = window.innerWidth;
                
                shareDropdown.classList.remove('align-right', 'align-left');
                
                if (rect.right > windowWidth / 2) {
                    shareDropdown.classList.add('align-right');
                } else {
                    shareDropdown.classList.add('align-left');
                }
                
                shareDropdown.classList.toggle('is-open');
            });
            
            // Close when clicking outside
            document.addEventListener('click', (e) => {
                if (!shareDropdown.contains(e.target) && !shareBtn.contains(e.target)) {
                    shareDropdown.classList.remove('is-open');
                }
            });
        }
    });

    // Save Button Toggle (Local state)
    const saveBtns = document.querySelectorAll('.nx-save-btn');
    saveBtns.forEach(saveBtn => {
        saveBtn.addEventListener('click', () => {
            saveBtn.classList.toggle('is-saved');
        });
    });

    // Copy Link Button
    const copyBtns = document.querySelectorAll('.nx-copy-btn');
    copyBtns.forEach(copyBtn => {
        copyBtn.addEventListener('click', () => {
            const url = copyBtn.getAttribute('data-url') || window.location.href;
            navigator.clipboard.writeText(url).then(() => {
                const originalHTML = copyBtn.innerHTML;
                copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                setTimeout(() => {
                    copyBtn.innerHTML = originalHTML;
                }, 2000);
            });
        });
    });

    // Dynamic Avatars
    const avatarContainers = document.querySelectorAll('.author-row');
    avatarContainers.forEach(container => {
        const nameEl = container.querySelector('.nx-author-name');
        const avatarEl = container.querySelector('.nx-dynamic-avatar');
        
        if (nameEl && avatarEl) {
            const nameStr = nameEl.textContent.trim();
            if (nameStr) {
                const parts = nameStr.split(' ');
                let initials = parts[0].charAt(0);
                if (parts.length > 1) {
                    initials += parts[parts.length - 1].charAt(0);
                }
                avatarEl.textContent = initials.toUpperCase();
            }
        }
    });
}
