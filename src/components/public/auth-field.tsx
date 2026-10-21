"use client";

import { useId, useState, type ComponentProps } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function passwordStrength(value: string) {
  if (!value) return 0;
  if (value.length < 12 || /^(password|passw0rd|qwerty|123456|admin)/i.test(value) || /(.)\1{3}/u.test(value)) return 1;
  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z0-9]/].filter(rule => rule.test(value)).length;
  return Math.min(4, 2 + Number(value.length >= 16) + Number(variety >= 3));
}

const strengthLabels = ['Belum diisi', 'Mudah ditebak', 'Perlu diperkuat', 'Cukup kuat', 'Lebih kuat'];

export function AuthField({ label, hint, strength = false, type = 'text', ...props }: ComponentProps<typeof Input> & { label: string; hint?: string; strength?: boolean }) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [score, setScore] = useState(0);
  const password = type === 'password';

  function validate(input: HTMLInputElement) {
    const validity = input.validity;
    const original = input.name === 'confirmPassword' ? input.form?.elements.namedItem('password') : null;
    if (validity.valid && original instanceof HTMLInputElement && input.value !== original.value) {
      setError('Konfirmasi kata sandi belum sama.');
      return;
    }
    setError(validity.valueMissing ? 'Kolom ini wajib diisi.'
      : validity.typeMismatch ? 'Masukkan alamat email yang valid.'
      : validity.tooShort ? `Gunakan minimal ${input.minLength} karakter.`
      : validity.patternMismatch ? hint || 'Periksa format isian.'
      : validity.valid ? '' : input.validationMessage);
  }

  return <div className="auth-field">
    <label htmlFor={id}>{label}{props.required && <span aria-hidden="true"> *</span>}</label>
    <div className="auth-input-wrap">
      <Input {...props} id={id} type={password && visible ? 'text' : type}
        autoCapitalize={password || props.name === 'username' ? 'none' : undefined}
        spellCheck={password ? false : undefined}
        aria-invalid={Boolean(error)} aria-describedby={`${id}-feedback${strength ? ` ${id}-strength` : ''}`}
        onBlur={event => { validate(event.currentTarget); props.onBlur?.(event); }}
        onInvalid={event => { validate(event.currentTarget); props.onInvalid?.(event); }}
        onChange={event => { setError(''); if (strength) setScore(passwordStrength(event.currentTarget.value)); props.onChange?.(event); }} />
      {password && <button type="button" className="auth-password-toggle" disabled={props.disabled}
        aria-label={`Tampilkan ${label.toLowerCase()}`} aria-controls={id} aria-pressed={visible}
        onClick={() => setVisible(!visible)}>
        {visible ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
      </button>}
    </div>
    <small id={`${id}-feedback`} className={error ? 'auth-inline-error' : undefined} aria-live="polite">{error || hint}</small>
    {strength && <div id={`${id}-strength`} className="auth-strength">
      <div role="meter" aria-label="Perkiraan kekuatan kata sandi" aria-valuemin={0} aria-valuemax={4} aria-valuenow={score} aria-valuetext={strengthLabels[score]} className="auth-strength-bars">
        {[1, 2, 3, 4].map(segment => <span key={segment} data-filled={segment <= score} />)}
      </div>
      <small role="status">Perkiraan: {strengthLabels[score]}. Bukan syarat tambahan.</small>
      <small>Utamakan frasa panjang dan unik. Huruf, angka, atau simbol dapat membantu.</small>
    </div>}
  </div>;
}
