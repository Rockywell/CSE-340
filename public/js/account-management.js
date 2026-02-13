const select = document.getElementById('accountList');
const link = document.getElementById('manageRoleLink');


select.addEventListener('change', () => {
    const accountId = select.value;
    if (accountId) {
        link.href = `/account/update/${accountId}/role`;
        link.style.pointerEvents = 'auto';
        link.style.opacity = 1;
    } else {
        link.href = '#';
        link.style.pointerEvents = 'none';
        link.style.opacity = 0.5;
    }
});