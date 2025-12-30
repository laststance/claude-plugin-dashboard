/**
 * StatusIcon component
 * Displays plugin status with colored icons:
 * - ● (green) = Installed & Enabled
 * - ◐ (yellow) = Installed & Disabled
 * - ○ (gray) = Not installed
 */

import { Text } from 'ink'

interface StatusIconProps {
  isInstalled: boolean
  isEnabled: boolean
}

/**
 * Displays a status icon based on plugin installation and enabled state
 * @example
 * <StatusIcon isInstalled={true} isEnabled={true} />  // ● (green)
 * <StatusIcon isInstalled={true} isEnabled={false} /> // ◐ (yellow)
 * <StatusIcon isInstalled={false} isEnabled={false} /> // ○ (gray)
 */
export default function StatusIcon({
  isInstalled,
  isEnabled,
}: StatusIconProps) {
  if (isInstalled && isEnabled) {
    return <Text color="green">●</Text>
  }

  if (isInstalled && !isEnabled) {
    return <Text color="yellow">◐</Text>
  }

  return <Text color="gray">○</Text>
}
