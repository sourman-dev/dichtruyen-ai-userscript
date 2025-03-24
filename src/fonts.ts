// Hàm kiểm tra phần tử có hiển thị không
function isElementVisible(element: HTMLElement): boolean {
    const style: CSSStyleDeclaration = window.getComputedStyle(element);
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      element.offsetWidth > 0 &&
      element.offsetHeight > 0
    );
  }

  // Hàm kiểm tra phần tử có nội dung văn bản không
  function hasVisibleText(element: Element): boolean {
    const text: string = element.textContent?.trim() || '';
    // Loại bỏ các phần tử chỉ chứa ký tự trắng hoặc không có nội dung
    return text.length > 0 && !/^\s*$/.test(text);
  }

  // Hàm lấy font-family từ các phần tử hiển thị chữ (bao gồm Shadow DOM)
  function getVisibleFontFamilies(root: Document | ShadowRoot = document): Set<string> {
    const fontFamilies: Set<string> = new Set();

    const traverse = (element: Element) => {
      // Chỉ xử lý nếu phần tử hiển thị và có nội dung văn bản
      if (element instanceof HTMLElement && isElementVisible(element) && hasVisibleText(element)) {
        const style: CSSStyleDeclaration = window.getComputedStyle(element);
        const fontFamily: string = style.fontFamily;
        if (fontFamily) {
          const families: string[] = fontFamily
            .split(',')
            .map((family: string) => family.trim().replace(/['"]/g, ''));
          // Chỉ lấy font đầu tiên trong danh sách (font thực sự được áp dụng)
          if (families.length > 0) {
            fontFamilies.add(families[0]);
          }
        }
      }

      // Kiểm tra Shadow DOM
      if ('shadowRoot' in element && element.shadowRoot) {
        element.shadowRoot.querySelectorAll('*').forEach(traverse);
      }

      // Duyệt qua các phần tử con
      element.querySelectorAll('*').forEach(traverse);
    };

    root.querySelectorAll('*').forEach(traverse);
    return fontFamilies;
  }

  // Hàm chính: Lấy font-family của các phần tử hiển thị chữ
  export function getVisibleFontFamiliesOnPage(): string[] {
    const fontFamilies: Set<string> = getVisibleFontFamilies();
    return Array.from(fontFamilies).sort();
  }