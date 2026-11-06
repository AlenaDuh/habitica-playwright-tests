import { type Locator, type Page } from '@playwright/test';

export class RegisterPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly continueButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Используем точные ID из HTML-кода страницы регистрации Habitica
    this.emailInput = page.locator('#emailInput');
    this.passwordInput = page.locator('#passwordInput');
    this.confirmPasswordInput = page.locator('#confirmPasswordInput');
    this.continueButton = page.locator('#continue-button');
    
    // Класс для поля с ошибкой
    this.errorMessage = page.locator('.input-with-error'); 
  }

   async goto() {
    await this.page.goto('https://habitica.com/register');
    // Ждем загрузки
    await this.page.waitForLoadState('networkidle');
    
    // Ищем кнопку принятия куки и кликаем по ней, если она есть
    const cookieButton = this.page.getByRole('button', { name: 'Accept All Cookies' });
    if (await cookieButton.isVisible()) {
        await cookieButton.click();
        // Ждем, пока баннер исчезнет
        await cookieButton.waitFor({ state: 'hidden' });
    }
  }

  async register(user: { email: string; pass: string; confirm?: string }) {
    await this.emailInput.fill(user.email);
    await this.passwordInput.fill(user.pass);
    await this.confirmPasswordInput.fill(user.confirm ?? user.pass);
    await this.continueButton.click();
  }
}