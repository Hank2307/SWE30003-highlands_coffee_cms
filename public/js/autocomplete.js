// public/js/autocomplete.js

class Autocomplete {
    constructor(inputElement, options = {}) {
      this.input = inputElement;
      this.options = options;
      this.data = options.data || [];
      this.onSelect = options.onSelect || (() => {});
      this.displayField = options.displayField || 'name';
      this.valueField = options.valueField || 'id';
      this.searchFields = options.searchFields || [this.displayField];
      this.placeholder = options.placeholder || 'Type to search...';
      this.minChars = options.minChars || 0;
      this.renderItem = options.renderItem || this.defaultRenderItem.bind(this);
      
      this.selectedIndex = -1;
      this.filteredData = [];
      this.isOpen = false;
      
      this.init();
    }
  
    init() {
      // Wrap input in autocomplete wrapper
      const wrapper = document.createElement('div');
      wrapper.className = 'autocomplete-wrapper';
      this.input.parentNode.insertBefore(wrapper, this.input);
      wrapper.appendChild(this.input);
      
      // Create dropdown
      this.dropdown = document.createElement('div');
      this.dropdown.className = 'autocomplete-dropdown hidden';
      wrapper.appendChild(this.dropdown);
      
      // Set placeholder
      this.input.placeholder = this.placeholder;
      
      // Add event listeners
      this.input.addEventListener('input', this.handleInput.bind(this));
      this.input.addEventListener('focus', this.handleFocus.bind(this));
      this.input.addEventListener('keydown', this.handleKeydown.bind(this));
      this.input.addEventListener('blur', this.handleBlur.bind(this));
      
      // Prevent form submission on Enter
      this.input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
        }
      });
    }
  
    setData(data) {
      this.data = data;
      if (this.isOpen) {
        this.updateDropdown();
      }
    }
  
    handleInput(e) {
      const query = e.target.value.trim();
      
      if (query.length < this.minChars && query.length > 0) {
        this.close();
        return;
      }
      
      this.updateDropdown(query);
    }
  
    handleFocus() {
      if (!this.isOpen) {
        this.updateDropdown(this.input.value.trim());
      }
    }
  
    handleKeydown(e) {
      if (!this.isOpen) return;
      
      switch(e.key) {
        case 'ArrowDown':
          e.preventDefault();
          this.selectedIndex = Math.min(this.selectedIndex + 1, this.filteredData.length - 1);
          this.highlightItem();
          break;
          
        case 'ArrowUp':
          e.preventDefault();
          this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
          this.highlightItem();
          break;
          
        case 'Enter':
          e.preventDefault();
          if (this.selectedIndex >= 0 && this.filteredData[this.selectedIndex]) {
            this.selectItem(this.filteredData[this.selectedIndex]);
          }
          break;
          
        case 'Escape':
          this.close();
          break;
      }
    }
  
    handleBlur() {
      // Delay to allow click on dropdown
      setTimeout(() => {
        this.close();
      }, 200);
    }
  
    updateDropdown(query = '') {
      this.filteredData = this.filterData(query);
      this.selectedIndex = -1;
      
      if (this.filteredData.length === 0) {
        this.dropdown.innerHTML = '<div class="autocomplete-no-results">No results found</div>';
      } else {
        this.dropdown.innerHTML = this.filteredData
          .map((item, index) => this.renderItem(item, index))
          .join('');
        
        // Add click listeners
        this.dropdown.querySelectorAll('.autocomplete-item').forEach((el, index) => {
          el.addEventListener('click', () => {
            this.selectItem(this.filteredData[index]);
          });
        });
      }
      
      this.open();
    }
  
    filterData(query) {
      if (!query) {
        return this.data;
      }
      
      const lowerQuery = query.toLowerCase();
      
      return this.data.filter(item => {
        return this.searchFields.some(field => {
          const value = this.getNestedValue(item, field);
          return value && value.toString().toLowerCase().includes(lowerQuery);
        });
      });
    }
  
    getNestedValue(obj, path) {
      return path.split('.').reduce((curr, prop) => curr?.[prop], obj);
    }
  
    defaultRenderItem(item, index) {
      const displayValue = this.getNestedValue(item, this.displayField);
      return `
        <div class="autocomplete-item" data-index="${index}">
          <div class="autocomplete-item-main">${displayValue}</div>
        </div>
      `;
    }
  
    highlightItem() {
      const items = this.dropdown.querySelectorAll('.autocomplete-item');
      items.forEach((item, index) => {
        if (index === this.selectedIndex) {
          item.classList.add('selected');
          item.scrollIntoView({ block: 'nearest' });
        } else {
          item.classList.remove('selected');
        }
      });
    }
  
    selectItem(item) {
      const displayValue = this.getNestedValue(item, this.displayField);
      const actualValue = this.getNestedValue(item, this.valueField);
      
      this.input.value = displayValue;
      this.input.dataset.value = actualValue;
      
      this.onSelect(item, actualValue);
      this.close();
    }
  
    open() {
      this.dropdown.classList.remove('hidden');
      this.isOpen = true;
    }
  
    close() {
      this.dropdown.classList.add('hidden');
      this.isOpen = false;
      this.selectedIndex = -1;
    }
  
    getValue() {
      return this.input.dataset.value || '';
    }
  
    clear() {
      this.input.value = '';
      this.input.dataset.value = '';
      this.close();
    }
  }
  
  // Export for use in other files
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Autocomplete;
  }