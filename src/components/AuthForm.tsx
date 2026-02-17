import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { Zap } from 'lucide-react';

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) setError(error.message);
    } else {
      if (!username.trim()) {
        setError('Username is required');
        setSubmitting(false);
        return;
      }
      const { error } = await signUp(email, password, username);
      if (error) setError(error.message);
      else setSuccess('Check your email to confirm your account!');
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 animate-slide-up">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2">
            <Zap className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold font-mono tracking-tight text-foreground">
              Brain<span className="text-primary text-glow-primary">Bolt</span>
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Adaptive Infinite Quiz Platform
          </p>
        </div>

        {/* Form */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-6">
          <div className="flex gap-2 bg-secondary rounded-md p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-all ${
                isLogin 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-all ${
                !isLogin 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Username</label>
                <Input
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="your_username"
                  className="bg-secondary border-border"
                />
              </div>
            )}
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Email</label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="bg-secondary border-border"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Password</label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="bg-secondary border-border"
              />
            </div>

            {error && (
              <p className="text-destructive text-sm">{error}</p>
            )}
            {success && (
              <p className="text-success text-sm">{success}</p>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Loading...' : isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
