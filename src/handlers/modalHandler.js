const fs = require('fs');
const path = require('path');

module.exports = (client) => {
    client.modals = new Map();

    const modalsPath = path.join(__dirname, '..', 'modals');
    const modalFiles = fs.readdirSync(modalsPath).filter(file => file.endsWith('.js'));

    for (const file of modalFiles) {
        const modal = require(path.join(modalsPath, file));
        if (modal && modal.customId && modal.execute) {
            client.modals.set(modal.customId, modal);
        } else {
            console.error(`Modal file ${file} is missing customId or execute function.`);
        }
    }
};
