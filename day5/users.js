let allUsers = [];

const loadBtn = document.getElementById('load-users');
const filterInput = document.getElementById('filter-input');
const statusP = document.getElementById('status');
const usersList = document.getElementById('users-list');

async function loadUsers() {
    loadBtn.disabled = true;
    statusP.textContent = 'Loading...';
    usersList.innerHTML = '';

    try {
        // NOTE: To test the error path, temporarily break the URL, e.g.:
        // const response = await fetch('https://jsonplaceholder.typicode.com/users-invalid');
        const response = await fetch('https://jsonplaceholder.typicode.com/users');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        allUsers = await response.json();
        statusP.textContent = 'Success! Users loaded.';
        renderUsers(allUsers);
    } catch (error) {
        statusP.textContent = `Error: ${error.message}`;
    } finally {
        loadBtn.disabled = false;
    }
}

function renderUsers(list) {
    usersList.innerHTML = '';
    
    if (list.length === 0) {
        statusP.textContent = 'No users match your filter.';
        return;
    }
    
    // Restore success message if we were previously showing the "no match" message
    if (statusP.textContent === 'No users match your filter.') {
        statusP.textContent = 'Success! Users loaded.';
    }

    list.forEach(user => {
        const li = document.createElement('li');
        
        const nameEl = document.createElement('div');
        nameEl.textContent = `Name: ${user.name}`;
        li.appendChild(nameEl);

        const emailEl = document.createElement('div');
        emailEl.textContent = `Email: ${user.email}`;
        li.appendChild(emailEl);

        const cityEl = document.createElement('div');
        cityEl.textContent = `City: ${user.address.city}`;
        li.appendChild(cityEl);

        const companyEl = document.createElement('div');
        companyEl.textContent = `Company: ${user.company.name}`;
        li.appendChild(companyEl);

        usersList.appendChild(li);
    });
}

loadBtn.addEventListener('click', loadUsers);

filterInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filteredUsers = allUsers.filter(user => 
        user.name.toLowerCase().includes(query)
    );
    renderUsers(filteredUsers);
});