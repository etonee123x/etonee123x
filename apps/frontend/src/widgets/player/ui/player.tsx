'use client';

import { useState, type ComponentProps } from 'react';
import { useAudioPlayer } from '@/entities/audio-player';
import { Check, Link, Pause, Play, Shuffle, SkipBack, SkipForward, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { BaseAlwaysScrollable } from '@/shared/ui/base-always-scrollable';
import { Button } from '@/shared/ui/ds/button';
import { Slider } from '@/shared/ui/ds/slider';
import { millisecondsToHumanReadable } from '@/shared/utils/milliseconds-to-human-readable';
import { Temporal } from 'temporal-polyfill';
import { useEventListener, useTimeoutFn } from '@reactuses/core';
import { Toggle } from '@/shared/ui/ds/toggle';
import { useIsTouchOnly } from '@/shared/hooks/use-is-touch-only';
import { useHasMounted } from '@/shared/hooks/use-has-mounted';
import { throwError } from '@/shared/utils/throw-error';
import { DEFAULT_VOLUME } from '@/entities/audio-player/model/local-storage-volume';
import { cn } from '@/shared/utils/cn';

const millisecondsToTimeFormats = (milliseconds: number) => {
  return {
    humanReadable: millisecondsToHumanReadable(milliseconds),
    iso: Temporal.Duration.from({ milliseconds: Math.ceil(milliseconds) }).toString(),
  };
};

const PlayerSlider = ({ className }: Pick<ComponentProps<'div'>, 'className'>) => {
  const t = useTranslations('ThePlayer');
  const { audio, track } = useAudioPlayer();
  if (!track) {
    throw new Error('No track available');
  }

  const getCurrentTime = () => {
    return audio.current?.currentTime ?? 0;
  };

  const [currentTime, setCurrentTime] = useState(getCurrentTime());

  const [seekPreview, setSeekPreview] = useState<number | null>(null);
  const duration = track.metadata.duration;

  useEventListener(
    'timeupdate',
    () => {
      setCurrentTime(getCurrentTime());
    },
    audio,
  );

  useEventListener(
    'loadstart',
    () => {
      setCurrentTime(getCurrentTime());
    },
    audio,
  );

  const sliderTimeSeconds = seekPreview ?? currentTime;

  const currentTimeFormats = millisecondsToTimeFormats(sliderTimeSeconds * 1000);
  const durationFormats = millisecondsToTimeFormats(duration);

  const onValueCommitted: ComponentProps<typeof Slider>['onValueCommitted'] = (value) => {
    const seconds = Number(value);

    if (audio.current) {
      // eslint-disable-next-line react-hooks/immutability -- HTMLAudioElement is an imperative browser API.
      audio.current.currentTime = seconds;
    }
    setCurrentTime(seconds);
    setSeekPreview(null);
  };

  const onValueChange: ComponentProps<typeof Slider>['onValueChange'] = (value) => {
    setSeekPreview(Number(value));
  };

  return (
    <div
      className={cn(
        'tabular-nums w-full mx-auto flex text-sm text-muted-foreground justify-between items-center gap-2',
        className,
      )}
    >
      <time dateTime={currentTimeFormats.iso}>{currentTimeFormats.humanReadable}</time>
      <Slider
        aria-label={t('trackProgress')}
        className="cursor-pointer"
        max={duration / 1000}
        min={0}
        step={0.1}
        onValueChange={onValueChange}
        onValueCommitted={onValueCommitted}
        value={[sliderTimeSeconds]}
      />
      <time dateTime={durationFormats.iso}>{durationFormats.humanReadable}</time>
    </div>
  );
};

const PlayerControlsVolume = () => {
  const { audio } = useAudioPlayer();
  const getVolume = () => {
    return audio.current?.volume ?? DEFAULT_VOLUME;
  };

  const [volume, setVolume] = useState(getVolume());
  const t = useTranslations('ThePlayer');

  const hasMounted = useHasMounted();

  const isTouchOnly = useIsTouchOnly();

  useEventListener(
    'volumechange',
    () => {
      setVolume(getVolume());
    },
    audio,
  );

  const onValueChangeVolume: ComponentProps<typeof Slider>['onValueChange'] = (value) => {
    const volume = Number(value);

    if (audio.current) {
      // eslint-disable-next-line react-hooks/immutability -- HTMLAudioElement is an imperative browser API.
      audio.current.volume = volume;
    }
    setVolume(volume);
  };

  return (
    hasMounted &&
    !isTouchOnly && (
      <Slider
        aria-label={t('volume')}
        className="cursor-pointer w-5/6 max-w-20"
        max={1}
        min={0}
        step={0.01}
        onValueChange={onValueChangeVolume}
        value={[volume]}
      />
    )
  );
};

const PlayerControls = () => {
  const t = useTranslations('ThePlayer');

  const { audio, next, previous, isShuffleModeEnabled, setIsShuffleModeEnabled, hasHistoryItems } = useAudioPlayer();

  const getIsPlaying = () => {
    if (!audio.current) {
      return false;
    }

    return !audio.current.paused;
  };

  const [isPlaying, setIsPlaying] = useState(getIsPlaying());

  const onPlaybackChange = () => {
    setIsPlaying(getIsPlaying());
  };

  useEventListener('play', onPlaybackChange, audio);
  useEventListener('pause', onPlaybackChange, audio);

  const onClickPlay = async () => {
    await audio.current?.play();
  };

  const onClickPause = () => {
    audio.current?.pause();
  };

  const onClickPrevious = () => {
    previous();
  };

  const onClickNext = () => {
    next();
  };

  const onPressedChangeIsShuffleModeEnabled: ComponentProps<typeof Toggle>['onPressedChange'] = (pressed) => {
    setIsShuffleModeEnabled(pressed);
  };

  const buttons = [
    {
      disabled: isShuffleModeEnabled && !hasHistoryItems,
      ariaLabel: t('previousTrack'),
      onClick: onClickPrevious,
      Icon: SkipBack,
    },
    isPlaying
      ? {
          ariaLabel: t('pauseTrack'),
          onClick: onClickPause,
          Icon: Pause,
        }
      : {
          ariaLabel: t('playTrack'),
          onClick: onClickPlay,
          Icon: Play,
        },
    {
      ariaLabel: t('nextTrack'),
      onClick: onClickNext,
      Icon: SkipForward,
    },
  ];

  return (
    <div className="grid grid-cols-[1fr_min-content_1fr] gap-4 items-center">
      <Toggle
        className="justify-self-end"
        aria-label={isShuffleModeEnabled ? t('disableShuffleTracks') : t('enableShuffleTracks')}
        pressed={isShuffleModeEnabled}
        onPressedChange={onPressedChangeIsShuffleModeEnabled}
      >
        <Shuffle />
      </Toggle>
      <ul className="flex justify-center gap-2">
        {buttons.map((button, index) => {
          return (
            <li key={index}>
              <Button size="lg" disabled={button.disabled} aria-label={button.ariaLabel} onClick={button.onClick}>
                <button.Icon />
              </Button>
            </li>
          );
        })}
      </ul>
      <PlayerControlsVolume />
    </div>
  );
};

const PlayerCopyLinkButton = () => {
  const t = useTranslations('ThePlayer');
  const track = useAudioPlayer().track ?? throwError();

  const [hasCopiedLink, setHasCopiedLink] = useState(false);
  const [, startCopiedLinkTimeout] = useTimeoutFn(
    () => {
      setHasCopiedLink(false);
    },
    1500,
    { immediate: false },
  );

  const onClickCopyLink = async () => {
    const trackUrl = new URL('/explorer' + track.path, globalThis.location.origin);

    await globalThis.navigator.clipboard.writeText(trackUrl.toString());
    setHasCopiedLink(true);
    startCopiedLinkTimeout();
  };

  return (
    <Button
      className="col-start-3"
      aria-label={hasCopiedLink ? t('copied') : t('copyLink')}
      size="icon-sm"
      variant="ghost"
      onClick={onClickCopyLink}
    >
      {hasCopiedLink ? <Check /> : <Link />}
    </Button>
  );
};

export const Player = () => {
  const t = useTranslations('ThePlayer');

  const { track, close } = useAudioPlayer();

  const onClickClose = () => {
    close();
  };

  if (!track) {
    return null;
  }

  return (
    <section className="layout-container flex flex-col justify-center bg-background z-player border-t border-primary pt-4 pb-6 w-full sticky bottom-0">
      <Button
        className="absolute inset-e-2 border-primary top-0 -translate-y-1/2!"
        aria-label={t('closePlayer')}
        size="icon"
        variant="secondary"
        onClick={onClickClose}
      >
        <X />
      </Button>

      <header className="grid grid-cols-[1fr_auto_1fr] items-center mb-2">
        <BaseAlwaysScrollable className="col-start-2 [--base-always-scrollable--content--margin:0_auto]">
          <h2 className="text-lg">{track.name}</h2>
        </BaseAlwaysScrollable>
        <PlayerCopyLinkButton />
      </header>

      <PlayerSlider className="mb-4" />

      <PlayerControls />
    </section>
  );
};
