const imgUser = document.getElementById('userfoto');

if (user) {

    if (user.foto) {
        imgUser.src = user.foto;
    } else {
        imgUser.src = "/image/UndefinedUser.jpg";
    }


    // Wrap the image in a link to the profile
    const link = document.createElement('a');

    link.href = `/user?id=${user._id}`;

    link.addEventListener("click", () => {
        if (window.location.pathname === "/" && window.location.search.length > 1) { localStorage.setItem("returnParams", window.location.search.substring(1)); }
    });

    link.textContent = 'Current user ';
    imgUser.parentNode.insertBefore(link, imgUser);
    link.appendChild(imgUser);
} else {
    // Set the default image
    imgUser.src = "/image/UndefinedUser.jpg";

    // Add the text "Guest" or the "Login" button
    const guestInfo = document.createElement('span');
    guestInfo.style.marginTop = '10px';
    guestInfo.style.textAlign = 'center';
    guestInfo.style.color = 'white';

    const guestText = document.createElement('span');
    guestText.textContent = '\u00A0User not defined';


    const loginButton = document.createElement('a');
    loginButton.href = '/login'; // It is assumed that you have a route /login
    loginButton.textContent = 'Login';
    loginButton.style.display = 'inline-block';
    loginButton.style.padding = '6px 12px';
    loginButton.style.backgroundColor = '#007bff';
    loginButton.style.color = '#fff';
    loginButton.style.borderRadius = '4px';
    loginButton.style.textDecoration = 'none';

    guestInfo.appendChild(guestText);
    guestInfo.appendChild(loginButton);

    imgUser.parentNode.appendChild(guestInfo);
}
