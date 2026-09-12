import { useTranslations } from 'next-intl';
import { SiTelegram, SiGithub } from '@icons-pack/react-simple-icons';

export const Footer = () => {
  const t = useTranslations('TheFooter');

  const links = [
    {
      icon: SiTelegram,
      href: `https://t.me/eto_ne_e123x`,
      text: t('telegram'),
    },
    {
      icon: SiGithub,
      href: 'https://github.com/etonee123x',
      text: t('gitHub'),
    },
  ];

  return (
    <footer className="z-footer border-t border-primary">
      <address className="layout-container py-4 flex gap-4 items-center italic">
        {links.map((link, index) => {
          return (
            <a key={index} rel="noopener noreferrer" target="_blank" href={link.href} aria-label={link.text}>
              <link.icon className="text-primary size-6" />
            </a>
          );
        })}
      </address>
    </footer>
  );
};
