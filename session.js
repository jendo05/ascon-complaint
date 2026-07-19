document.getElementById('button primary').addEventListener('click', () => {
    const text = document.getElementById('announcement-body').value.trim();
    
    if (text) {
        const announcement = {
            id: Date.now(), // Unique ID to track this specific post
            message: text
        };

        // Save to localStorage
        localStorage.setItem('currentAnnouncement', JSON.stringify(announcement));
        
        alert('Announcement published!');
        document.getElementById('announcement-body').value = ''; // Clear input
    }
});