// Form submission handler for Google Apps Script
// Based on dwyl/learn-to-send-email-via-google-script

function validateEmail(email) {
  var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function handleFormSubmit(e) {
  e.preventDefault();
  var form = e.target;
  var data = new FormData(form);
  
  // Validate required fields
  var name = data.get('name');
  var email = data.get('email');
  var message = data.get('message');
  
  if (!name || !email || !message) {
    showStatus(form, 'Please fill in all fields.', 'error');
    return false;
  }
  
  if (!validateEmail(email)) {
    showStatus(form, 'Please enter a valid email address.', 'error');
    return false;
  }
  
  // Show loading state
  var submitBtn = form.querySelector('[type="submit"]');
  var originalText = submitBtn.value;
  submitBtn.value = 'Sending...';
  submitBtn.disabled = true;
  
  // Send to Google Apps Script
  fetch(form.action, {
    method: 'POST',
    body: new FormData(form)
  })
  .then(function(response) {
    showStatus(form, 'Thank you! Your message has been sent.', 'success');
    form.reset();
    submitBtn.value = originalText;
    submitBtn.disabled = false;
  })
  .catch(function(error) {
    console.error('Error:', error);
    showStatus(form, 'Oops! There was an error sending your message. Please try again.', 'error');
    submitBtn.value = originalText;
    submitBtn.disabled = false;
  });
  
  return false;
}

function showStatus(form, message, status) {
  var statusDiv = form.querySelector('.form-status');
  if (!statusDiv) {
    statusDiv = document.createElement('div');
    statusDiv.className = 'form-status';
    form.insertBefore(statusDiv, form.firstChild);
  }
  
  statusDiv.textContent = message;
  statusDiv.className = 'form-status ' + status;
  statusDiv.style.display = 'block';
  
  // Auto-hide success message after 5 seconds
  if (status === 'success') {
    setTimeout(function() {
      statusDiv.style.display = 'none';
    }, 5000);
  }
}

// Initialize when DOM is loaded
function initFormHandler() {
  var forms = document.querySelectorAll('form.gform');
  for (var i = 0; i < forms.length; i++) {
    forms[i].addEventListener('submit', handleFormSubmit);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFormHandler);
} else {
  initFormHandler();
}
