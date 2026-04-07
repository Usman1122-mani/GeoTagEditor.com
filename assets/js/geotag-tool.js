// Geotag Editor Tool JavaScript

// DOM Elements
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const previewImage = document.getElementById('previewImage');
const latInput = document.getElementById('lat');
const lonInput = document.getElementById('lon');
const processBtn = document.getElementById('processBtn');
const status = document.getElementById('status');
const changeFileBtn = document.getElementById('change-file');
const autoFillBtn = document.getElementById('auto-fill');
const currentLat = document.getElementById('current-lat');
const currentLon = document.getElementById('current-lon');
const uploadSection = document.getElementById('upload-section');
const fileInfoSection = document.getElementById('file-info-section');
const coordinatesSection = document.getElementById('coordinates-section');
const step1 = document.getElementById('step-1');
const step2 = document.getElementById('step-2');
const step3 = document.getElementById('step-3');

// Notification elements
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notification-message');
const notificationIcon = document.getElementById('notification-icon');

// Map elements
const useCurrentLocationBtn = document.getElementById('useCurrentLocation');
const clearCoordinatesBtn = document.getElementById('clearCoordinates');
const locateMeBtn = document.getElementById('locateMe');

// Filename modal elements
const filenameModal = document.getElementById('filenameModal');
const filenameInput = document.getElementById('filenameInput');
const suggestedFilename = document.getElementById('suggestedFilename');
const modalClose = document.getElementById('modalClose');
const modalCancel = document.getElementById('modalCancel');
const modalConfirm = document.getElementById('modalConfirm');

// Processing elements
const processingSpinner = document.getElementById('processingSpinner');
const processText = document.getElementById('processText');

// Map variables
let map = null;
let marker = null;
let currentLocationMarker = null;
let currentFile = null;
let processedImageData = null;

// Debug logging
console.log('DOM Elements loaded:', {
    fileInput: !!fileInput,
    dropZone: !!dropZone,
    previewImage: !!previewImage,
    fileInfoSection: !!fileInfoSection,
    coordinatesSection: !!coordinatesSection
});

// Show notification
// Show notification with auto-hide
function showNotification(message, type = 'info') {
    console.log('Notification:', type, message);
    
    if (!notification || !notificationMessage || !notificationIcon) {
        console.error('Notification elements not found');
        return;
    }
    
    // Hide any existing notification first
    hideNotification();
    
    // Set message
    notificationMessage.textContent = message;
    
    // Set icon based on type
    let iconClass = 'fas fa-info-circle';
    let bgColor = 'bg-blue-100';
    let iconColor = 'text-blue-600';
    
    switch(type) {
        case 'success':
            iconClass = 'fas fa-check-circle';
            bgColor = 'bg-green-100';
            iconColor = 'text-green-600';
            break;
        case 'error':
            iconClass = 'fas fa-times-circle';
            bgColor = 'bg-red-100';
            iconColor = 'text-red-600';
            break;
        case 'warning':
            iconClass = 'fas fa-exclamation-triangle';
            bgColor = 'bg-yellow-100';
            iconColor = 'text-yellow-600';
            break;
    }
    
    // Update notification icon
    notificationIcon.className = `notification-icon w-6 h-6 rounded-full ${bgColor} flex items-center justify-center`;
    notificationIcon.innerHTML = `<i class="${iconClass} ${iconColor} text-xs"></i>`;
    
    // Show notification
    notification.classList.remove('translate-x-full');
    notification.classList.add('show');
    
    // Clear any existing timeout
    if (window.notificationTimeout) {
        clearTimeout(window.notificationTimeout);
    }
    
    // Auto hide after 5 seconds
    window.notificationTimeout = setTimeout(() => {
        hideNotification();
    }, 5000);
}

// Hide notification
function hideNotification() {
    if (notification) {
        notification.classList.remove('show');
        notification.classList.add('translate-x-full');
        
        // Clear timeout if exists
        if (window.notificationTimeout) {
            clearTimeout(window.notificationTimeout);
            window.notificationTimeout = null;
        }
    }
}
// Update status message
function updateStatus(message, type = 'info') {
    console.log('Status update:', type, message);
    
    if (!status) return;
    
    let iconClass = 'fas fa-info-circle text-blue-500';
    let statusClass = 'info';
    
    switch(type) {
        case 'success':
            iconClass = 'fas fa-check-circle text-green-500';
            statusClass = 'success';
            break;
        case 'error':
            iconClass = 'fas fa-times-circle text-red-500';
            statusClass = 'error';
            break;
        case 'warning':
            iconClass = 'fas fa-exclamation-triangle text-yellow-500';
            statusClass = 'warning';
            break;
    }
    
    status.innerHTML = `<div class="flex items-center justify-center"><i class="${iconClass} mr-2"></i><span>${message}</span></div>`;
    status.className = `status-message ${statusClass}`;
}

// Initialize Map
function initMap() {
    console.log('Initializing map...');
    
    if (!document.getElementById('map')) {
        console.error('Map container not found');
        return;
    }
    
    // Remove existing map if any
    if (map) {
        map.remove();
        map = null;
    }
    
    try {
        // Create map with default view (Los Angeles)
        map = L.map('map', {
            center: [34.0522, -118.2437],
            zoom: 10,
            scrollWheelZoom: true
        });
        
        // Add tile layer (Google Maps forced to English)
        L.tileLayer('https://{s}.google.com/vt/lyrs=m&tl=en&hl=en&x={x}&y={y}&z={z}', {
            attribution: 'Map data &copy; <a href="https://www.google.com/maps">Google</a>',
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
            maxZoom: 20,
            updateWhenIdle: false,
            updateWhenZooming: false,
            keepBuffer: 4
        }).addTo(map);
        
        // Create custom marker icon
        const customIcon = L.divIcon({
            className: 'custom-marker',
            html: '<div class="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center"><i class="fas fa-map-pin text-white text-xs"></i></div>',
            iconSize: [24, 24],
            iconAnchor: [12, 24]
        });
        
        // Initialize marker at default location
        marker = L.marker([34.0522, -118.2437], { 
            icon: customIcon,
            draggable: true
        }).addTo(map);
        
        // Add drag event to marker
        marker.on('dragend', function(e) {
            const position = marker.getLatLng();
            updateCoordinates(position.lat, position.lng);
        });
        
        // Add click event to map
        map.on('click', function(e) {
            console.log('Map clicked at:', e.latlng);
            updateCoordinates(e.latlng.lat, e.latlng.lng);
            updateMarker(e.latlng);
        });
        
        console.log('Map initialized successfully');
        
        // Ensure size is correct if initialized while transition happens
        setTimeout(() => {
            if (map) map.invalidateSize();
        }, 200);
        
        
    } catch (error) {
        console.error('Error initializing map:', error);
        showNotification('Error loading map. Please refresh the page.', 'error');
    }
}

// Update coordinates in inputs and map
function updateCoordinates(lat, lng) {
    console.log('Updating coordinates:', lat, lng);
    
    if (latInput) latInput.value = lat.toFixed(6);
    if (lonInput) lonInput.value = lng.toFixed(6);
    
    updateMarker([lat, lng]);
    
    // Enable process button if we have a file
    if (currentFile && processBtn) {
        processBtn.disabled = false;
    }
}

// Update marker position
function updateMarker(latlng) {
    if (marker && map) {
        marker.setLatLng(latlng);
        map.setView(latlng, 13);
    }
}

// Get current location
function getCurrentLocation() {
    console.log('Getting current location...');
    
    if (!navigator.geolocation) {
        showNotification('Geolocation is not supported by this browser', 'error');
        return;
    }
    
    updateStatus('Getting your location...', 'info');
    
    navigator.geolocation.getCurrentPosition(
        function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            console.log('Location found:', lat, lng);
            updateCoordinates(lat, lng);
            
            updateStatus('Location found! Coordinates updated.', 'success');
            showNotification('Location found! Coordinates updated.', 'success');
            
            // Add current location marker
            if (currentLocationMarker && map) {
                map.removeLayer(currentLocationMarker);
            }
            
            const currentLocationIcon = L.divIcon({
                className: 'current-location-marker',
                html: '<div class="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>',
                iconSize: [16, 16],
                iconAnchor: [8, 8]
            });
            
            currentLocationMarker = L.marker([lat, lng], { 
                icon: currentLocationIcon,
                zIndexOffset: 1000
            }).addTo(map);
            
        },
        function(error) {
            console.error('Geolocation error:', error);
            let errorMessage = 'Unable to retrieve your location';
            
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = 'Location access denied. Please allow location access in browser settings.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = 'Location information is unavailable';
                    break;
                case error.TIMEOUT:
                    errorMessage = 'Location request timed out';
                    break;
            }
            
            updateStatus(errorMessage, 'error');
            showNotification(errorMessage, 'error');
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

// Clear coordinates
function clearCoordinates() {
    console.log('Clearing coordinates...');
    
    if (latInput) latInput.value = '';
    if (lonInput) lonInput.value = '';
    
    // Reset marker to default location
    if (marker && map) {
        marker.setLatLng([34.0522, -118.2437]);
        map.setView([34.0522, -118.2437], 10);
    }
    
    // Remove current location marker
    if (currentLocationMarker && map) {
        map.removeLayer(currentLocationMarker);
        currentLocationMarker = null;
    }
    
    if (processBtn) processBtn.disabled = true;
    updateStatus('Coordinates cleared. Enter new coordinates or select from map.', 'info');
}

// Reset tool to initial state
function resetTool() {
    console.log('Resetting tool...');
    
    currentFile = null;
    processedImageData = null;
    
    // Reset UI sections
    if (uploadSection) uploadSection.classList.remove('hidden');
    if (fileInfoSection) fileInfoSection.classList.add('hidden');
    if (coordinatesSection) coordinatesSection.classList.add('hidden');
    
    // Reset step indicators
    if (step1) step1.classList.add('active');
    if (step2) step2.classList.remove('active');
    if (step3) step3.classList.remove('active');
    
    // Reset buttons
    if (processBtn) processBtn.disabled = true;
    
    // Clear file input
    if (fileInput) fileInput.value = '';
    
    // Reset status
    updateStatus('Upload a JPEG or PNG image to begin editing GPS data', 'info');
    
    // Clear coordinates
    clearCoordinates();
    
    showNotification('Tool reset. Ready to upload new image.', 'info');
}

// Format file size
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
}

// Check for existing GPS data in the image
function checkForGPSData(file) {
    console.log('Checking for GPS data in file:', file.name);
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const exifObj = piexif.load(e.target.result);
            const gpsData = exifObj.GPS;
            
            console.log('EXIF GPS data found:', gpsData);
            
            if (gpsData && Object.keys(gpsData).length > 0) {
                updateStatus('GPS data found in image', 'success');
                
                // Try to extract and display existing coordinates
                try {
                    const lat = piexif.GPSHelper.dmsRationalToDeg(
                        gpsData[piexif.GPSIFD.GPSLatitude], 
                        gpsData[piexif.GPSIFD.GPSLatitudeRef]
                    );
                    const lon = piexif.GPSHelper.dmsRationalToDeg(
                        gpsData[piexif.GPSIFD.GPSLongitude], 
                        gpsData[piexif.GPSIFD.GPSLongitudeRef]
                    );
                    
                    console.log('Extracted coordinates:', lat, lon);
                    
                    if (!isNaN(lat) && !isNaN(lon)) {
                        // Update current coordinates display
                        if (currentLat) currentLat.textContent = lat.toFixed(6);
                        if (currentLon) currentLon.textContent = lon.toFixed(6);
                        
                        // Auto-fill the coordinate inputs
                        if (latInput) latInput.value = lat.toFixed(6);
                        if (lonInput) lonInput.value = lon.toFixed(6);
                        
                        // Update map marker
                        updateMarker([lat, lon]);
                        
                        // Enable process button
                        if (processBtn) processBtn.disabled = false;
                        
                        showNotification('GPS data found and auto-filled!', 'success');
                    } else {
                        if (currentLat) currentLat.textContent = 'Invalid data';
                        if (currentLon) currentLon.textContent = 'Invalid data';
                    }
                } catch (err) {
                    console.error('Error extracting GPS data:', err);
                    if (currentLat) currentLat.textContent = 'Could not extract';
                    if (currentLon) currentLon.textContent = 'Could not extract';
                }
            } else {
                updateStatus('No GPS data found - ready to add new coordinates', 'info');
                if (currentLat) currentLat.textContent = 'No data';
                if (currentLon) currentLon.textContent = 'No data';
            }
        } catch (err) {
            console.error('Error reading EXIF data:', err);
            updateStatus('No EXIF data found - ready to add GPS coordinates', 'info');
            if (currentLat) currentLat.textContent = 'No data';
            if (currentLon) currentLon.textContent = 'No data';
        }
    };
    
    reader.onerror = (err) => {
        console.error('Error reading file:', err);
        showNotification('Error reading image file', 'error');
    };
    
    reader.readAsDataURL(file);
}

// File selection handler
function handleFileSelect(event) {
    console.log('File selected event:', event);
    
    const file = fileInput.files[0];
    if (!file) {
        console.log('No file selected');
        return;
    }
    
    console.log('Selected file:', file.name, file.type, file.size);
    
    // Check if file is JPEG or PNG
    if (!file.type.match('image/jpeg') && !file.type.match('image/png') && 
        !file.name.toLowerCase().endsWith('.jpg') && 
        !file.name.toLowerCase().endsWith('.jpeg') && 
        !file.name.toLowerCase().endsWith('.png')) {
        showNotification('Please upload a JPEG or PNG image (.jpg, .jpeg, or .png format)', 'error');
        return;
    }
    
    // Check file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
        showNotification('File size must be less than 20MB', 'error');
        return;
    }
    
    currentFile = file;
    
    // Update file info (if elements exist)
    const fileNameElement = document.getElementById('file-name');
    const fileSizeElement = document.getElementById('file-size');
    
    if (fileNameElement) fileNameElement.textContent = file.name;
    if (fileSizeElement) fileSizeElement.textContent = formatFileSize(file.size);
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        console.log('File loaded for preview');
        
        // Set preview image source
        if (previewImage) {
            previewImage.src = e.target.result;
            previewImage.onload = () => {
                console.log('Preview image loaded');
            };
        }
        
        // Show file info section and hide upload section
        if (uploadSection) {
            uploadSection.classList.add('hidden');
            console.log('Upload section hidden');
        }
        
        if (fileInfoSection) {
            fileInfoSection.classList.remove('hidden');
            console.log('File info section shown');
        }
        
        if (coordinatesSection) {
            coordinatesSection.classList.remove('hidden');
            console.log('Coordinates section shown');
        }
        
        // Update step indicator
        if (step1) step1.classList.remove('active');
        if (step2) step2.classList.add('active');
        
        // Initialize map if not already done
        if (!map) {
            console.log('Initializing map for the first time');
            setTimeout(() => initMap(), 100);
        } else {
            console.log('Map already initialized');
            setTimeout(() => {
                map.invalidateSize();
                if (marker) {
                    map.setView(marker.getLatLng(), map.getZoom());
                }
            }, 100);
        }
        
        // Enable process button if coordinates are filled
        if (processBtn && latInput && lonInput && latInput.value && lonInput.value) {
            processBtn.disabled = false;
        }
        
        showNotification('Image loaded successfully!', 'success');
    };
    
    reader.onerror = (err) => {
        console.error('Error loading file preview:', err);
        showNotification('Error loading image preview', 'error');
    };
    
    reader.readAsDataURL(file);
    
    // Check for existing GPS data
    setTimeout(() => checkForGPSData(file), 100);
}

// Auto-fill coordinates from existing GPS data
function autoFillCoordinates() {
    console.log('Auto-fill clicked');
    
    if (!currentFile) {
        showNotification('Please upload an image first', 'warning');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const exifObj = piexif.load(e.target.result);
            const gpsData = exifObj.GPS;
            
            if (gpsData && gpsData[piexif.GPSIFD.GPSLatitude] && gpsData[piexif.GPSIFD.GPSLongitude]) {
                const lat = piexif.GPSHelper.dmsRationalToDeg(
                    gpsData[piexif.GPSIFD.GPSLatitude], 
                    gpsData[piexif.GPSIFD.GPSLatitudeRef]
                );
                const lon = piexif.GPSHelper.dmsRationalToDeg(
                    gpsData[piexif.GPSIFD.GPSLongitude], 
                    gpsData[piexif.GPSIFD.GPSLongitudeRef]
                );
                
                if (!isNaN(lat) && !isNaN(lon)) {
                    updateCoordinates(lat, lon);
                    showNotification('Coordinates auto-filled from image EXIF data', 'success');
                } else {
                    showNotification('No valid GPS data found in image', 'warning');
                }
            } else {
                showNotification('No GPS data found in image', 'warning');
            }
        } catch (err) {
            console.error('Error reading EXIF data:', err);
            showNotification('Could not read EXIF data from image', 'error');
        }
    };
    
    reader.onerror = (err) => {
        console.error('Error reading file:', err);
        showNotification('Error reading image file', 'error');
    };
    
    reader.readAsDataURL(currentFile);
}

// Process the image and add GPS data
function processImage() {
    console.log('Process button clicked');
    
    const file = currentFile;
    const latVal = parseFloat(latInput ? latInput.value : '');
    const lonVal = parseFloat(lonInput ? lonInput.value : '');
    
    if (!file) {
        showNotification('Please upload an image first', 'warning');
        return;
    }
    
    if (isNaN(latVal) || isNaN(lonVal)) {
        showNotification('Please enter valid latitude and longitude values', 'warning');
        return;
    }
    
    // Validate latitude range
    if (latVal < -90 || latVal > 90) {
        showNotification('Latitude must be between -90 and 90', 'error');
        return;
    }
    
    // Validate longitude range
    if (lonVal < -180 || lonVal > 180) {
        showNotification('Longitude must be between -180 and 180', 'error');
        return;
    }
    
    // Show processing state
    if (processingSpinner) processingSpinner.classList.remove('hidden');
    if (processText) processText.textContent = 'Processing...';
    if (processBtn) processBtn.disabled = true;
    
    // Update step indicator
    if (step2) step2.classList.remove('active');
    if (step3) step3.classList.add('active');
    
    updateStatus('Processing image with new GPS data...', 'info');
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const processBase64 = (base64) => {
            try {
                console.log('Processing image with piexif...');
                const latRef = latVal >= 0 ? "N" : "S";
                const lonRef = lonVal >= 0 ? "E" : "W";
                
                // Create GPS data object
                const gpsData = {};
                gpsData[piexif.GPSIFD.GPSLatitudeRef] = latRef;
                gpsData[piexif.GPSIFD.GPSLatitude] = piexif.GPSHelper.degToDmsRational(latVal);
                gpsData[piexif.GPSIFD.GPSLongitudeRef] = lonRef;
                gpsData[piexif.GPSIFD.GPSLongitude] = piexif.GPSHelper.degToDmsRational(lonVal);
                
                // Create EXIF object
                const exifObj = { 
                    "0th": {}, 
                    "Exif": {}, 
                    "GPS": gpsData, 
                    "1st": {},
                    "thumbnail": null 
                };
                
                const exifBytes = piexif.dump(exifObj);
                processedImageData = piexif.insert(exifBytes, base64);
                
                console.log('Image processed successfully');
                updateStatus('Image processed successfully! Ready to download.', 'success');
                showNotification('Image processed successfully!', 'success');
                
                // Generate suggested filename
                const originalName = file.name;
                const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
                const suggestedName = `geotag_edited_${nameWithoutExt}.jpg`;
                
                if (suggestedFilename) suggestedFilename.textContent = suggestedName;
                if (filenameInput) filenameInput.value = suggestedName;
                
                // Show filename modal
                if (filenameModal) {
                    filenameModal.classList.add('show');
                    console.log('Filename modal shown');
                }
                
            } catch (err) {
                console.error('Processing error:', err);
                updateStatus('Error processing image: ' + err.message, 'error');
                showNotification('Error processing image: ' + err.message, 'error');
                
                // Reset step indicator
                if (step3) step3.classList.remove('active');
                if (step2) step2.classList.add('active');
            } finally {
                // Reset button state
                if (processingSpinner) processingSpinner.classList.add('hidden');
                if (processText) processText.textContent = 'Process Image & Download';
                if (processBtn) processBtn.disabled = false;
            }
        };

        if (file.type.match('image/png') || file.name.toLowerCase().endsWith('.png')) {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                // Fill white background for transparent PNGs
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                const jpegBase64 = canvas.toDataURL('image/jpeg', 1.0);
                processBase64(jpegBase64);
            };
            img.onerror = () => {
                showNotification('Error converting PNG to JPEG', 'error');
                updateStatus('Error converting PNG to JPEG', 'error');
                if (processingSpinner) processingSpinner.classList.add('hidden');
                if (processText) processText.textContent = 'Process Image & Download';
                if (processBtn) processBtn.disabled = false;
                if (step3) step3.classList.remove('active');
                if (step2) step2.classList.add('active');
            };
            img.src = e.target.result;
        } else {
            processBase64(e.target.result);
        }
    };
    
    reader.onerror = function(err) {
        console.error('File reader error:', err);
        updateStatus('Error reading image file', 'error');
        showNotification('Error reading image file', 'error');
        
        if (processingSpinner) processingSpinner.classList.add('hidden');
        if (processText) processText.textContent = 'Process Image & Download';
        if (processBtn) processBtn.disabled = false;
        if (step3) step3.classList.remove('active');
        if (step2) step2.classList.add('active');
    };
    
    reader.readAsDataURL(file);
}

// Download the processed image with custom filename
function downloadImage(filename) {
    console.log('Downloading image:', filename);
    
    if (!processedImageData) {
        showNotification('No processed image data available', 'error');
        return;
    }
    
    try {
        // Create download link
        const link = document.createElement("a");
        link.href = processedImageData;
        link.download = filename;
        link.style.display = "none";
        
        // Append to body, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('Download initiated');
        showNotification('Image downloaded successfully!', 'success');
        updateStatus('Image downloaded! Upload another image to continue.', 'success');
        
    } catch (err) {
        console.error('Download error:', err);
        showNotification('Error downloading image: ' + err.message, 'error');
        updateStatus('Download failed: ' + err.message, 'error');
    }
}

// Initialize the tool
function initTool() {
    console.log('Initializing Geotag Editor Tool...');
    
    // Check if all required elements exist
    const requiredElements = [
        'fileInput', 'dropZone', 'previewImage', 'lat', 'lon', 'processBtn', 'status'
    ];
    
    const missingElements = requiredElements.filter(id => !document.getElementById(id));
    if (missingElements.length > 0) {
        console.error('Missing required elements:', missingElements);
        showNotification('Some page elements failed to load. Please refresh the page.', 'error');
        return;
    }
    
    // Initialize map immediately
    initMap();
    
    // Event Listeners for File Upload
    if (dropZone) {
        dropZone.addEventListener('click', () => {
            console.log('Drop zone clicked');
            if (fileInput) fileInput.click();
        });
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('drag-over');
        });
        
        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('drag-over');
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('drag-over');
            
            if (e.dataTransfer.files.length) {
                console.log('File dropped:', e.dataTransfer.files[0].name);
                fileInput.files = e.dataTransfer.files;
                handleFileSelect(e);
            }
        });
    }
    
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
    
    if (processBtn) {
        processBtn.addEventListener('click', processImage);
    }
    
    // Change file button
    const changeFileBtnElement = document.getElementById('change-file');
    if (changeFileBtnElement) {
        changeFileBtnElement.addEventListener('click', () => {
            console.log('Change file clicked');
            if (fileInput) fileInput.value = '';
            resetTool();
        });
    }
    
    // Auto-fill button
    const autoFillBtnElement = document.getElementById('auto-fill');
    if (autoFillBtnElement) {
        autoFillBtnElement.addEventListener('click', autoFillCoordinates);
    }
    
    // Map-related event listeners
    if (useCurrentLocationBtn) {
        useCurrentLocationBtn.addEventListener('click', getCurrentLocation);
    }
    
    if (clearCoordinatesBtn) {
        clearCoordinatesBtn.addEventListener('click', clearCoordinates);
    }
    
    if (locateMeBtn) {
        locateMeBtn.addEventListener('click', getCurrentLocation);
    }
    
    // Coordinate input listeners
    if (latInput) {
        latInput.addEventListener('input', () => {
            const lat = parseFloat(latInput.value);
            const lon = parseFloat(lonInput ? lonInput.value : '');
            if (!isNaN(lat) && !isNaN(lon) && currentFile && processBtn) {
                processBtn.disabled = false;
            }
        });
    }
    
    if (lonInput) {
        lonInput.addEventListener('input', () => {
            const lat = parseFloat(latInput ? latInput.value : '');
            const lon = parseFloat(lonInput.value);
            if (!isNaN(lat) && !isNaN(lon) && currentFile && processBtn) {
                processBtn.disabled = false;
            }
        });
    }
    
    // Filename modal event listeners
    if (modalClose) {
        modalClose.addEventListener('click', () => {
            console.log('Modal close clicked');
            if (filenameModal) filenameModal.classList.remove('show');
            resetTool();
        });
    }
    
    if (modalCancel) {
        modalCancel.addEventListener('click', () => {
            console.log('Modal cancel clicked');
            if (filenameModal) filenameModal.classList.remove('show');
            resetTool();
        });
    }
    
    if (modalConfirm) {
        modalConfirm.addEventListener('click', () => {
            console.log('Modal confirm clicked');
            const filename = filenameInput ? filenameInput.value.trim() : '';
            if (!filename) {
                showNotification('Please enter a filename', 'warning');
                return;
            }
            
            // Ensure the filename has .jpg extension
            let finalFilename = filename;
            if (!finalFilename.toLowerCase().endsWith('.jpg') && !finalFilename.toLowerCase().endsWith('.jpeg')) {
                finalFilename += '.jpg';
            }
            
            // Download the image with the custom filename
            downloadImage(finalFilename);
            
            // Close the modal
            if (filenameModal) filenameModal.classList.remove('show');
            
            // Reset after a delay
            setTimeout(() => {
                resetTool();
            }, 2000);
        });
    }
    
    // Use suggested filename when clicked
    if (suggestedFilename) {
        suggestedFilename.addEventListener('click', () => {
            if (filenameInput) {
                filenameInput.value = suggestedFilename.textContent;
            }
        });
    }
    
    // Close notification when close button clicked
    const notificationClose = document.getElementById('notification-close');
    if (notificationClose) {
        notificationClose.addEventListener('click', hideNotification);
    }
    
    // Close modal when clicking outside
    if (filenameModal) {
        filenameModal.addEventListener('click', (e) => {
            if (e.target === filenameModal) {
                filenameModal.classList.remove('show');
                resetTool();
            }
        });
    }
    
    // Add CSS for map markers
    const style = document.createElement('style');
    style.textContent = `
        .custom-marker {
            background: transparent;
            border: none;
        }
        
        .current-location-marker {
            background: transparent;
            border: none;
        }
        
        .leaflet-marker-icon {
            transition: transform 0.3s ease;
        }
        
        .leaflet-marker-icon:hover {
            transform: scale(1.2);
        }
        
        #map {
            min-height: 400px;
        }
    `;
    document.head.appendChild(style);
    
    console.log('Geotag Editor Tool initialized successfully');
    updateStatus('Ready to upload JPEG image', 'info');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded');
    
    // Check if Piexif is loaded
    if (typeof piexif === 'undefined') {
        console.error('Piexif library not loaded');
        showNotification('Error: Required library not loaded. Please refresh the page.', 'error');
        return;
    }
    
    // Check if Leaflet is loaded
    if (typeof L === 'undefined') {
        console.error('Leaflet library not loaded');
        showNotification('Error: Map library not loaded. Please refresh the page.', 'error');
        return;
    }
    
    // Initialize tool immediately
    initTool();
});

// Also initialize when window loads
window.addEventListener('load', function() {
    console.log('Window loaded');
});