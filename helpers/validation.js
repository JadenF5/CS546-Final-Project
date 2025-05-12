export const validateEmail = (email) => {
    if (!email || typeof email !== "string")
        throw new Error("Email must be a non-empty string.");
    email = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) throw new Error("Invalid email format.");
    return email;
};

export const validateString = (
    input,
    fieldName = "Input",
    min = 1,
    max = 50,
    regex = /^[\w\s-]+$/
) => {
    if (!input || typeof input !== "string")
        throw new Error`${fieldName} must be a non-empty string.`();
    input = input.trim();
    if (input.length < min || input.length > max)
        throw new Error`${fieldName} must be between ${min} and ${max} characters.`();
    if (!regex.test(input))
        throw new Error`${fieldName} contains invalid characters.`();
    return input;
};

export const validatePassword = (password) => {
    if (!password || typeof password !== "string")
        throw new Error("Password must be a non-empty string.");
    password = password.trim();
    if (password.length < 8 || password.length > 64)
        throw new Error("Password must be between 8 and 64 characters.");
    const complexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).+$/;
    if (!complexityRegex.test(password))
        throw new Error(
            "Password must include uppercase, lowercase, number, and special character."
        );
    return password;
};
