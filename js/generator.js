// ============================================================
// Bougeotte — Moteur de génération de courriers & emails
// ============================================================

import { getCategorieById } from './data.js';

/**
 * Formats a date in French style
 */
function formatDateFR(dateStr) {
    const months = [
        'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
        'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
    ];
    const d = new Date(dateStr);
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Gets today's date in French format
 */
function todayFR() {
    return formatDateFR(new Date().toISOString().split('T')[0]);
}

/**
 * Generate a formal French letter for address change
 */
export function genererCourrier(organisme, userData) {
    const { prenom, nom, ancienneAdresse, nouvelleAdresse, dateDemenagement, ville } = userData;
    const dateFormatted = formatDateFR(dateDemenagement);
    const cat = getCategorieById(organisme.categorie);

    // Determine the subject/object line
    let objetDetails = '';
    switch (organisme.categorie) {
        case 'banque':
            objetDetails = 'de mon compte bancaire';
            break;
        case 'assurance':
            objetDetails = 'de mon contrat d\'assurance';
            break;
        case 'telecom':
            objetDetails = 'de mon abonnement';
            break;
        case 'energie':
            objetDetails = 'de mon contrat d\'énergie';
            break;
        case 'sante':
            objetDetails = 'de mon dossier';
            break;
        case 'administration':
            objetDetails = 'de mon dossier administratif';
            break;
        case 'emploi':
            objetDetails = 'de mon dossier';
            break;
        case 'transport':
            objetDetails = 'de mon abonnement transport';
            break;
        case 'logement':
            objetDetails = 'de mon dossier logement';
            break;
        default:
            objetDetails = 'de mon dossier client';
    }

    // Build the letter
    const lettre = `${prenom} ${nom}
${ancienneAdresse.replace(/\n/g, '\n')}

${organisme.adresse || organisme.nom}

${ville}, le ${todayFR()}

Objet : Changement d'adresse — Mise à jour ${objetDetails}

Madame, Monsieur,

Par la présente, je vous informe de mon changement d'adresse à compter du ${dateFormatted}.

Mon adresse actuelle :
${ancienneAdresse}

Ma nouvelle adresse :
${nouvelleAdresse}

Je vous serais reconnaissant(e) de bien vouloir mettre à jour mes coordonnées dans vos fichiers afin que l'ensemble de mes correspondances et documents soient désormais adressés à ma nouvelle adresse.

${organisme.note ? `Note : ${organisme.note}\n` : ''}Je me tiens à votre disposition pour tout complément d'information.

Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

${prenom} ${nom}`;

    return lettre;
}

/**
 * Generate an email body for address change
 */
export function genererEmail(organisme, userData) {
    const { prenom, nom, ancienneAdresse, nouvelleAdresse, dateDemenagement } = userData;
    const dateFormatted = formatDateFR(dateDemenagement);

    let objetDetails = 'mon dossier';
    switch (organisme.categorie) {
        case 'banque': objetDetails = 'mon compte'; break;
        case 'assurance': objetDetails = 'mon contrat'; break;
        case 'telecom': objetDetails = 'mon abonnement'; break;
        case 'energie': objetDetails = 'mon contrat'; break;
        case 'sante': objetDetails = 'mon dossier santé'; break;
        case 'emploi': objetDetails = 'mon dossier'; break;
        default: objetDetails = 'mon dossier client';
    }

    const sujet = `Changement d'adresse — ${prenom} ${nom}`;

    const corps = `Bonjour,

Je me permets de vous contacter afin de vous informer de mon changement d'adresse, effectif à compter du ${dateFormatted}.

Ancienne adresse :
${ancienneAdresse}

Nouvelle adresse :
${nouvelleAdresse}

Pourriez-vous mettre à jour ${objetDetails} avec ces nouvelles coordonnées ?

${organisme.note ? `📌 ${organisme.note}\n` : ''}Je vous remercie par avance pour votre diligence.

Cordialement,
${prenom} ${nom}`;

    return { sujet, corps };
}

/**
 * Generate a mailto link
 */
export function genererMailtoLink(organisme, userData) {
    const { sujet, corps } = genererEmail(organisme, userData);
    const email = organisme.email || '';
    return `mailto:${email}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps)}`;
}

/**
 * Generate all documents for selected organisms
 */
export function genererTousDocuments(organismes, userData) {
    return organismes.map(org => {
        const courrier = genererCourrier(org, userData);
        const email = genererEmail(org, userData);
        const mailtoLink = genererMailtoLink(org, userData);
        const cat = getCategorieById(org.categorie);

        return {
            organisme: org,
            categorie: cat,
            courrier,
            email,
            mailtoLink,
            type: org.type,
            statut: 'pending', // pending, sent, completed
        };
    });
}
