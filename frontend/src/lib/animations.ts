// Animation Libraries and Utilities
export interface AnimationOptions {
  duration?: number
  easing?: string
  delay?: number
  iterations?: number
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse'
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both'
}

// Check if animations are supported and not disabled
export const isAnimationSupported = (): boolean => {
  if (typeof window === 'undefined') return false
  
  // Check if user prefers reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  if (prefersReducedMotion.matches) return false
  
  // Check if CSS animations are supported
  const testElement = document.createElement('div')
  return 'animation' in testElement.style
}

// Success animations
export const createSuccessAnimation = (element: HTMLElement, options: AnimationOptions = {}): Animation | null => {
  if (!isAnimationSupported()) return null

  const { duration = 600, easing = 'ease-out', delay = 0 } = options

  const keyframes = [
    { transform: 'scale(0.8)', opacity: 0 },
    { transform: 'scale(1.1)', opacity: 1, offset: 0.5 },
    { transform: 'scale(1)', opacity: 1 }
  ]

  return element.animate(keyframes, {
    duration,
    easing,
    delay,
    fill: 'forwards'
  })
}

// Confetti animation
export const createConfettiAnimation = (container?: HTMLElement): void => {
  if (!isAnimationSupported()) return

  const targetContainer = container || document.body
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD']
  
  // Create confetti pieces
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div')
    confetti.style.cssText = `
      position: fixed;
      width: 8px;
      height: 8px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      top: -10px;
      left: ${Math.random() * 100}vw;
      z-index: 9999;
      pointer-events: none;
      border-radius: 2px;
    `
    
    targetContainer.appendChild(confetti)
    
    // Animate confetti fall
    const animation = confetti.animate([
      { 
        transform: `translateY(0) rotate(0deg)`,
        opacity: 1
      },
      { 
        transform: `translateY(100vh) rotate(${Math.random() * 360}deg)`,
        opacity: 0
      }
    ], {
      duration: 3000 + Math.random() * 2000,
      easing: 'cubic-bezier(0.5, 0, 0.5, 1)'
    })
    
    // Remove confetti after animation
    animation.addEventListener('finish', () => {
      confetti.remove()
    })
  }
}

// Slide in animations
export const slideIn = (element: HTMLElement, direction: 'left' | 'right' | 'up' | 'down' = 'up', options: AnimationOptions = {}): Animation | null => {
  if (!isAnimationSupported()) return null

  const { duration = 300, easing = 'ease-out', delay = 0 } = options
  
  const transforms = {
    left: ['translateX(-100%)', 'translateX(0)'],
    right: ['translateX(100%)', 'translateX(0)'],
    up: ['translateY(100%)', 'translateY(0)'],
    down: ['translateY(-100%)', 'translateY(0)']
  }

  const keyframes = [
    { transform: transforms[direction][0], opacity: 0 },
    { transform: transforms[direction][1], opacity: 1 }
  ]

  return element.animate(keyframes, {
    duration,
    easing,
    delay,
    fill: 'forwards'
  })
}

// Fade animations
export const fadeIn = (element: HTMLElement, options: AnimationOptions = {}): Animation | null => {
  if (!isAnimationSupported()) return null

  const { duration = 300, easing = 'ease-in', delay = 0 } = options

  return element.animate([
    { opacity: 0 },
    { opacity: 1 }
  ], {
    duration,
    easing,
    delay,
    fill: 'forwards'
  })
}

export const fadeOut = (element: HTMLElement, options: AnimationOptions = {}): Animation | null => {
  if (!isAnimationSupported()) return null

  const { duration = 300, easing = 'ease-out', delay = 0 } = options

  return element.animate([
    { opacity: 1 },
    { opacity: 0 }
  ], {
    duration,
    easing,
    delay,
    fill: 'forwards'
  })
}

// Scale animations
export const scaleIn = (element: HTMLElement, options: AnimationOptions = {}): Animation | null => {
  if (!isAnimationSupported()) return null

  const { duration = 200, easing = 'ease-out', delay = 0 } = options

  return element.animate([
    { transform: 'scale(0)', opacity: 0 },
    { transform: 'scale(1)', opacity: 1 }
  ], {
    duration,
    easing,
    delay,
    fill: 'forwards'
  })
}

// Pulse animation
export const pulse = (element: HTMLElement, options: AnimationOptions = {}): Animation | null => {
  if (!isAnimationSupported()) return null

  const { duration = 1000, iterations = Infinity } = options

  return element.animate([
    { transform: 'scale(1)', opacity: 1 },
    { transform: 'scale(1.05)', opacity: 0.7 },
    { transform: 'scale(1)', opacity: 1 }
  ], {
    duration,
    iterations,
    easing: 'ease-in-out'
  })
}

// Shake animation for errors
export const shake = (element: HTMLElement, options: AnimationOptions = {}): Animation | null => {
  if (!isAnimationSupported()) return null

  const { duration = 500, easing = 'ease-in-out' } = options

  return element.animate([
    { transform: 'translateX(0)' },
    { transform: 'translateX(-10px)' },
    { transform: 'translateX(10px)' },
    { transform: 'translateX(-10px)' },
    { transform: 'translateX(10px)' },
    { transform: 'translateX(-5px)' },
    { transform: 'translateX(5px)' },
    { transform: 'translateX(0)' }
  ], {
    duration,
    easing
  })
}

// Bounce animation
export const bounce = (element: HTMLElement, options: AnimationOptions = {}): Animation | null => {
  if (!isAnimationSupported()) return null

  const { duration = 600, easing = 'ease-out' } = options

  return element.animate([
    { transform: 'translateY(0)' },
    { transform: 'translateY(-20px)', offset: 0.25 },
    { transform: 'translateY(0)', offset: 0.5 },
    { transform: 'translateY(-10px)', offset: 0.75 },
    { transform: 'translateY(0)' }
  ], {
    duration,
    easing
  })
}

// Loading spinner animation
export const createLoadingSpinner = (element: HTMLElement, options: AnimationOptions = {}): Animation | null => {
  if (!isAnimationSupported()) return null

  const { duration = 1000, iterations = Infinity } = options

  return element.animate([
    { transform: 'rotate(0deg)' },
    { transform: 'rotate(360deg)' }
  ], {
    duration,
    iterations,
    easing: 'linear'
  })
}

// Transaction success sequence
export const playTransactionSuccessSequence = (container: HTMLElement): Promise<void> => {
  return new Promise((resolve) => {
    if (!isAnimationSupported()) {
      resolve()
      return
    }

    // Find success icon and amount elements
    const successIcon = container.querySelector('.success-icon') as HTMLElement
    const amountElement = container.querySelector('.success-amount') as HTMLElement
    const messageElement = container.querySelector('.success-message') as HTMLElement

    let completedAnimations = 0
    const totalAnimations = 3

    const checkComplete = () => {
      completedAnimations++
      if (completedAnimations >= totalAnimations) {
        // Trigger confetti after main animations
        setTimeout(() => {
          createConfettiAnimation(container)
          resolve()
        }, 200)
      }
    }

    // Animate success icon
    if (successIcon) {
      const iconAnimation = createSuccessAnimation(successIcon, { duration: 600, delay: 100 })
      iconAnimation?.addEventListener('finish', checkComplete)
    } else {
      checkComplete()
    }

    // Animate amount
    if (amountElement) {
      const amountAnimation = slideIn(amountElement, 'up', { duration: 400, delay: 300 })
      amountAnimation?.addEventListener('finish', checkComplete)
    } else {
      checkComplete()
    }

    // Animate message
    if (messageElement) {
      const messageAnimation = fadeIn(messageElement, { duration: 400, delay: 500 })
      messageAnimation?.addEventListener('finish', checkComplete)
    } else {
      checkComplete()
    }
  })
}

// Page transition animations
export const slidePageTransition = (
  currentPage: HTMLElement, 
  nextPage: HTMLElement, 
  direction: 'forward' | 'backward' = 'forward'
): Promise<void> => {
  return new Promise((resolve) => {
    if (!isAnimationSupported()) {
      currentPage.style.display = 'none'
      nextPage.style.display = 'block'
      resolve()
      return
    }

    const slideDirection = direction === 'forward' ? 'left' : 'right'
    const slideOutDirection = direction === 'forward' ? 'right' : 'left'

    // Slide out current page
    const slideOutTransform = slideOutDirection === 'left' ? 'translateX(-100%)' : 'translateX(100%)'
    const currentPageAnimation = currentPage.animate([
      { transform: 'translateX(0)', opacity: 1 },
      { transform: slideOutTransform, opacity: 0 }
    ], {
      duration: 300,
      easing: 'ease-in-out',
      fill: 'forwards'
    })

    // Slide in next page
    const slideInTransform = slideDirection === 'left' ? 'translateX(-100%)' : 'translateX(100%)'
    nextPage.style.display = 'block'
    const nextPageAnimation = nextPage.animate([
      { transform: slideInTransform, opacity: 0 },
      { transform: 'translateX(0)', opacity: 1 }
    ], {
      duration: 300,
      easing: 'ease-in-out',
      fill: 'forwards'
    })

    nextPageAnimation.addEventListener('finish', () => {
      currentPage.style.display = 'none'
      resolve()
    })
  })
}

// Utility to animate number counting
export const animateCounter = (
  element: HTMLElement, 
  start: number, 
  end: number, 
  duration: number = 1000,
  formatter?: (value: number) => string
): void => {
  if (!isAnimationSupported()) {
    element.textContent = formatter ? formatter(end) : end.toString()
    return
  }

  const startTime = performance.now()
  const difference = end - start

  const updateCounter = (currentTime: number) => {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    
    // Easing function (ease-out)
    const easeOut = 1 - Math.pow(1 - progress, 3)
    const currentValue = start + (difference * easeOut)
    
    element.textContent = formatter ? formatter(currentValue) : Math.round(currentValue).toString()
    
    if (progress < 1) {
      requestAnimationFrame(updateCounter)
    }
  }

  requestAnimationFrame(updateCounter)
} 