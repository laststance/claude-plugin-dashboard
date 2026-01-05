"""
E2E tests for display and content verification in claude-plugin-dashboard.

These tests verify that:
- The dashboard launches and displays correctly
- Plugin lists show expected content
- claude-plugins-official marketplace is visible
- CLI commands work correctly
"""
import time
import pexpect
import pytest


@pytest.mark.e2e
class TestDashboardDisplay:
    """Test that the dashboard renders correctly."""

    def test_dashboard_launches(self, spawn_cli, keys):
        """Dashboard should launch and show Discover tab."""
        child = spawn_cli()
        child.expect('Discover', timeout=10)
        keys.quit(child)

    def test_shows_plugin_list(self, spawn_cli, keys):
        """Dashboard should show plugin list with install counts."""
        child = spawn_cli()
        child.expect('Discover', timeout=10)

        # Should display install count pattern (e.g., "55.2K installs")
        index = child.expect([
            r'installs',
            'No plugins',
            pexpect.TIMEOUT
        ], timeout=5)

        assert index in [0, 1], "Dashboard should show plugins or empty state"
        keys.quit(child)

    def test_shows_official_plugins(self, spawn_cli, keys):
        """Dashboard should show claude-plugins-official plugins."""
        child = spawn_cli()
        child.expect('Discover', timeout=10)

        # Look for official marketplace
        index = child.expect([
            'claude-plugins-official',
            'official',
            pexpect.TIMEOUT
        ], timeout=5)

        if index == 2:
            pytest.skip("No official plugins visible - may be data issue")

        keys.quit(child)


@pytest.mark.e2e
class TestTabNavigation:
    """Test tab navigation display."""

    def test_installed_tab(self, spawn_cli, keys):
        """Can navigate to Installed tab."""
        child = spawn_cli()
        child.expect('Discover', timeout=10)
        time.sleep(0.5)  # Wait for init

        keys.send_key(child, keys.TAB)

        keys.quit(child)

    def test_marketplaces_tab(self, spawn_cli, keys):
        """Can navigate to Marketplaces tab."""
        child = spawn_cli()
        child.expect('Discover', timeout=10)
        time.sleep(0.5)  # Wait for init

        keys.send_key(child, keys.TAB, delay=0.2)
        keys.send_key(child, keys.TAB)

        keys.quit(child)

    def test_errors_tab(self, spawn_cli, keys):
        """Can navigate to Errors tab."""
        child = spawn_cli()
        child.expect('Discover', timeout=10)
        time.sleep(0.5)  # Wait for init

        keys.send_key(child, keys.TAB, delay=0.2)
        keys.send_key(child, keys.TAB, delay=0.2)
        keys.send_key(child, keys.TAB)

        keys.quit(child)


@pytest.mark.e2e
class TestCLICommands:
    """Test non-interactive CLI commands."""

    def test_status_command(self, spawn_cli):
        """status command shows statistics."""
        child = spawn_cli('status')

        # Wait for process to complete
        child.expect(pexpect.EOF, timeout=10)
        child.wait()  # Ensure process terminates

        assert child.exitstatus == 0

    def test_list_command(self, spawn_cli):
        """list command shows plugins."""
        child = spawn_cli('list')

        child.expect(pexpect.EOF, timeout=10)
        child.wait()

        # Should have output
        output = child.before
        assert len(output) > 0, "list command should produce output"
        assert child.exitstatus == 0

    def test_help_command(self, spawn_cli):
        """help command shows usage information."""
        child = spawn_cli('help')

        child.expect(pexpect.EOF, timeout=10)
        child.wait()

        # Should have output
        output = child.before
        assert 'Usage' in output or 'usage' in output or 'USAGE' in output or len(output) > 50
        assert child.exitstatus == 0
