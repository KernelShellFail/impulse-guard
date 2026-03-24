document.addEventListener('DOMContentLoaded', () => {
  const rateInput = document.getElementById('hourlyRate');
  const saveBtn = document.getElementById('saveBtn');
  const status = document.getElementById('status');

  // Load saved rate
  chrome.storage.sync.get(['hourlyRate'], (result) => {
    if (result.hourlyRate) {
      rateInput.value = result.hourlyRate;
    }
  });

  // Save rate
  saveBtn.addEventListener('click', () => {
    const rawValue = rateInput.value.trim();
    const rate = parseFloat(rawValue);

    // Validate input
    if (!rawValue || isNaN(rate) || rate <= 0) {
      status.textContent = '⚠️ Please enter a valid amount greater than 0.';
      status.style.color = 'red';
      return;
    }

    // Save valid input
    chrome.storage.sync.set({ hourlyRate: rate }, () => {
      status.textContent = '✅ Settings saved!';
      status.style.color = 'green';
      setTimeout(() => {
        status.textContent = '';
        status.style.color = 'black'; // reset color
      }, 2000);
    });
  });
});
