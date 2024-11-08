// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-storage.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBAxkYXQRBekD_qkBdridxxPvxwRfzS60E",
    authDomain: "certificate-d752f.firebaseapp.com",
    projectId: "certificate-d752f",
    storageBucket: "certificate-d752f.appspot.com",
    messagingSenderId: "226028132002",
    appId: "1:226028132002:web:7ec2523ec9d242f1efe9fb",
    measurementId: "G-FZSR6FBSBB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Predefined subcategories (same as admin)
const subcategoriesMap = {
    "Education": ["Hackathon", "Courses", "Internship"],
    "Training": ["Workshop", "Seminar", "Certification"],
    "Achievement": ["Award", "Recognition", "Competition"]
};

// Get filter elements
const filterCategory = document.getElementById('filter-category');
const filterSubcategory = document.getElementById('filter-subcategory');
const certificatesContainer = document.getElementById('certificates-container');

// Load unique categories from Firestore
async function loadCategories() {
    const querySnapshot = await getDocs(collection(db, 'certificates'));
    const categoriesSet = new Set();
    querySnapshot.forEach(doc => {
        const data = doc.data();
        if (data.category) categoriesSet.add(data.category);
    });

    // Populate category filter
    categoriesSet.forEach(category => {
        filterCategory.innerHTML += `<option value="${category}">${category}</option>`;
    });
}

// Populate subcategories based on selected category
filterCategory.addEventListener('change', async function() {
    const selectedCategory = this.value;
    populateSubcategories(selectedCategory);
    loadCertificates(selectedCategory, 'all');
});

// Function to populate subcategories
async function populateSubcategories(category) {
    filterSubcategory.innerHTML = '<option value="all">All</option>';
    if (category === 'all') {
        // If "All" categories are selected, show all unique subcategories
        const querySnapshot = await getDocs(collection(db, 'certificates'));
        const subcategoriesSet = new Set();
        querySnapshot.forEach(doc => {
            const data = doc.data();
            if (data.subcategory) subcategoriesSet.add(data.subcategory);
        });
        subcategoriesSet.forEach(subcat => {
            filterSubcategory.innerHTML += `<option value="${subcat}">${subcat}</option>`;
        });
    } else {
        // Fetch subcategories for the selected category
        const subcats = subcategoriesMap[category] || [];
        // Additionally, fetch any custom subcategories from Firestore
        const q = query(db, collection(db, 'certificates'), where('category', '==', category));
        const querySnapshot = await getDocs(q);
        const customSubcats = new Set();
        querySnapshot.forEach(doc => {
            const data = doc.data();
            if (data.subcategory && !subcats.includes(data.subcategory)) {
                customSubcats.add(data.subcategory);
            }
        });
        subcats.forEach(subcat => {
            filterSubcategory.innerHTML += `<option value="${subcat}">${subcat}</option>`;
        });
        customSubcats.forEach(subcat => {
            filterSubcategory.innerHTML += `<option value="${subcat}">${subcat}</option>`;
        });
    }
}

// Event listener for subcategory change
filterSubcategory.addEventListener('change', function() {
    const selectedCategory = filterCategory.value;
    const selectedSubcategory = this.value;
    loadCertificates(selectedCategory, selectedSubcategory);
});

// Function to load and display certificates based on filters
async function loadCertificates(category, subcategory) {
    certificatesContainer.innerHTML = ''; // Clear previous content

    let certificatesQuery = collection(db, 'certificates');

    if (category !== 'all') {
        certificatesQuery = query(certificatesQuery, where('category', '==', category));
    }

    if (subcategory !== 'all') {
        certificatesQuery = query(certificatesQuery, where('subcategory', '==', subcategory));
    }

    try {
        const querySnapshot = await getDocs(certificatesQuery);
        console.log('Certificates Query Snapshot:', querySnapshot.size);

        if (querySnapshot.empty) {
            certificatesContainer.innerHTML = '<p>No certificates found for the selected criteria.</p>';
            return;
        }

        // Create category containers with subcategories and certificates
        const categoryMap = new Map();

        querySnapshot.forEach(doc => {
            const cert = doc.data();
            console.log('Certificate Data:', cert);
            if (!categoryMap.has(cert.category)) {
                categoryMap.set(cert.category, new Map());
            }

            const subcategoryMap = categoryMap.get(cert.category);
            if (!subcategoryMap.has(cert.subcategory)) {
                subcategoryMap.set(cert.subcategory, []);
            }

            subcategoryMap.get(cert.subcategory).push(cert);
        });

        categoryMap.forEach((subcategories, category) => {
            const categoryDiv = document.createElement('div');
            categoryDiv.classList.add('category-container');
            categoryDiv.innerHTML = `<h3>${category}</h3>`;

            subcategories.forEach((certificates, subcategory) => {
                const subcategoryDiv = document.createElement('div');
                subcategoryDiv.classList.add('subcategory-container');
                subcategoryDiv.innerHTML = `<h4>${subcategory}</h4>`;

                certificates.forEach(async cert => {
                    const certificateDiv = document.createElement('div');
                    certificateDiv.classList.add('certificate');

                    try {
                        const imageUrl = await getDownloadURL(ref(storage, cert.imagePath));
                        console.log('Fetched Image URL:', imageUrl);
                    
                        certificateDiv.innerHTML = `
                            <img src="${imageUrl}" alt="${cert.name}">
                            <h4>${cert.name}</h4>
                            <p><strong>Date:</strong> ${cert.date}</p>
                            <a href="${cert.fileUrl}" target="_blank">View Certificate</a>
                        `;
                    } catch (error) {
                        console.error('Error fetching image URL:', error, cert.imagePath);
                        certificateDiv.innerHTML = `
                            <h4>${cert.name}</h4>
                            <p><strong>Date:</strong> ${cert.date}</p>
                            <p>Image not available</p>
                            <a href="${cert.fileUrl}" target="_blank">View Certificate</a>
                        `;
                    }
                    

                    subcategoryDiv.appendChild(certificateDiv);
                });

                categoryDiv.appendChild(subcategoryDiv);
            });

            certificatesContainer.appendChild(categoryDiv);
        });
    } catch (error) {
        console.error('Error fetching certificates:', error);
        certificatesContainer.innerHTML = '<p>Error loading certificates. Please try again later.</p>';
    }
}


// Initial Load
await loadCategories();
populateSubcategories('all');
loadCertificates('all', 'all');
