import logoImage from '@/assets/bantayani-logo.png';

interface BantayAniLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const BantayAniLogo = ({ size = 'md', showText = false }: BantayAniLogoProps) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  return (
    <div className="flex items-center gap-3">
      <img 
        src={logoImage} 
        alt="BantayAni Logo" 
        className={`${sizeClasses[size]} object-contain`}
      />
      {showText && (
        <div className="flex flex-col">
          <span className={`${textSizes[size]} font-bold text-foreground`}>
            BantayAni
          </span>
          {size !== 'sm' && (
            <span className="text-xs text-muted-foreground">
              Smart Agricultural Pest Detection
            </span>
          )}
        </div>
      )}
    </div>
  );
};
