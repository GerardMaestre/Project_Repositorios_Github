// Archivo: generate.js
const fs = require('fs');

const USERNAME = 'Gmdrax'; // Tu usuario

async function updatePortfolio() {
    console.log(`🤖 Iniciando actualización automática para @${USERNAME}...`);

    try {
        // 1. Descargar datos frescos (Usuario + Repos)
        const [userRes, reposRes] = await Promise.all([
            fetch(`https://api.github.com/users/${USERNAME}`),
            fetch(`https://api.github.com/users/${USERNAME}/repos?per_page=100&sort=updated`)
        ]);

        if (!userRes.ok) throw new Error(`Error API usuario: ${userRes.status}`);
        if (!reposRes.ok) throw new Error(`Error API repos: ${reposRes.status}`);

        const user = await userRes.json();
        const repos = await reposRes.json();

        // 2. Preparar el archivo JSON
        const data = {
            last_updated: new Date().toISOString(),
            user: user,
            repos: repos
        };

        // 3. Guardar (Sobrescribir database.json)
        fs.writeFileSync('database.json', JSON.stringify(data, null, 2));
        console.log('✅ database.json actualizado con éxito.');

    } catch (error) {
        console.error('❌ Error en la actualización:', error);
        process.exit(1); // Forzar error para que GitHub te avise
    }
}

updatePortfolio();
