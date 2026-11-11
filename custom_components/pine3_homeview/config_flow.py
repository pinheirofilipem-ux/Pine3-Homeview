"""Config flow for Pine3 Homeview (single instance, no options)."""

from homeassistant import config_entries

from .const import DOMAIN


class Pine3ViewConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Pine3 Homeview."""

    VERSION = 1

    async def async_step_user(self, user_input=None):
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")
        if user_input is not None:
            return self.async_create_entry(title="Pine3 Homeview", data={})
        return self.async_show_form(step_id="user")
