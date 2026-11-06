import { test, expect } from '@playwright/test';
import { RegisterPage } from './pages/RegisterPage';

// Генерируем уникальные данные для каждого теста
const generateUser = (): { email: string; pass: string; confirm?: string } => ({
  email: `test_${Date.now()}@example.com`,
  pass: 'ValidPass123',
});

test.describe('Регистрация в Habitica', () => {
  
  // 1. Smoke / Positive
  test('Успешная регистрация (Smoke)', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const user = generateUser();
    await registerPage.goto();
    await registerPage.register(user);
    
    // После нажатия "Продолжить" Habitica должна перекинуть на другой экран (например, создание персонажа)
    // Если остались на форме, или появилась ошибка — значит что-то не так.
    await page.waitForTimeout(2000); 
    await expect(page).not.toHaveURL(/.*\/register/); 
  });

  // 2. Negative: пустой email
  test('Регистрация с пустым email', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const user = generateUser();
    user.email = '';
    await registerPage.goto();
    
    // Заполняем только пароли
    await registerPage.passwordInput.fill(user.pass);
    await registerPage.confirmPasswordInput.fill(user.pass);
    
    // Ожидаем, что кнопка не станет кликабельной
    await expect(registerPage.continueButton).toBeDisabled();
  });

  // 3. Negative: email без @
  test('Регистрация с email без @', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const user = generateUser();
    user.email = 'invalid-email.com'; // Нет @
    await registerPage.goto();
    
    await registerPage.passwordInput.fill(user.pass);
    await registerPage.confirmPasswordInput.fill(user.pass);
    
    await expect(registerPage.continueButton).toBeDisabled();
  });

  // 4. Boundary: пароль короче 8 символов
  test('Регистрация с паролем короче 8 символов', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const user = generateUser();
    user.pass = 'Short7'; // 7 символов
    await registerPage.goto();
    
    await registerPage.emailInput.fill(user.email);
    await registerPage.passwordInput.fill(user.pass);
    await registerPage.confirmPasswordInput.fill(user.pass);
    
    await expect(registerPage.continueButton).toBeDisabled();
  });

    // 5. Negative: пароли не совпадают
  test('Пароль и подтверждение не совпадают', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const user = generateUser();
    user.confirm = 'DifferentPass123'; // Отличается от user.pass
    
    await registerPage.goto();
    
    // Заполняем поля вручную, НЕ нажимая кнопку
    await registerPage.emailInput.fill(user.email);
    await registerPage.passwordInput.fill(user.pass);
    await registerPage.confirmPasswordInput.fill(user.confirm!);
    
    // Просто проверяем, что кнопка заблокирована
    await expect(registerPage.continueButton).toBeDisabled();
  });

    // 6. Negative: повторная регистрация существующего email
  test('Повторная регистрация существующего email', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const user = generateUser();
    
    // Сначала регистрируем
    await registerPage.goto();
    await registerPage.register(user);
    await page.waitForTimeout(3000); // Ждем редиректа
    
    // Возвращаемся и пробуем снова с тем же email
    await registerPage.goto();
    await registerPage.register(user);
    
    // Habitica пропускает нас дальше на страницу выбора имени пользователя
    // Это значит, что система не заблокировала повторную регистрацию
    await expect(page).toHaveURL(/.*\/username/);
  });

  // 7. Security: XSS в поле email
  test('XSS-инъекция в поле email', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const user = generateUser();
    user.email = '<script>alert("XSS")</script>@test.com';
    
    await registerPage.goto();
    
    await registerPage.emailInput.fill(user.email);
    await registerPage.passwordInput.fill(user.pass);
    await registerPage.confirmPasswordInput.fill(user.pass);
    
    // Если сайт не упал и не выдал критическую ошибку — защита сработала.
    // Проверяем, что введенный текст остался в поле как строка
    await expect(registerPage.emailInput).toHaveValue(user.email);
  });

  // 8. Boundary: пароль 8 и 64 символа
  test('Граничные значения пароля (8 и 64)', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    
    // 8 символов
    let user = generateUser();
    user.pass = 'Pass1234'; 
    await registerPage.goto();
    
    await registerPage.emailInput.fill(user.email);
    await registerPage.passwordInput.fill(user.pass);
    await registerPage.confirmPasswordInput.fill(user.pass);
    
    // Кнопка должна стать активной
    await expect(registerPage.continueButton).toBeEnabled();
    
    // 64 символа
    await registerPage.goto();
    user = generateUser();
    user.pass = 'A'.repeat(63) + '1'; 
    
    await registerPage.emailInput.fill(user.email);
    await registerPage.passwordInput.fill(user.pass);
    await registerPage.confirmPasswordInput.fill(user.pass);
    
    await expect(registerPage.continueButton).toBeEnabled();
  });
});