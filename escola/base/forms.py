# Em: escola/base/forms.py
from django.contrib.auth.forms import UserCreationForm, UserChangeForm, AuthenticationForm
from .models import Usuario

class CustomUserCreationForm(UserCreationForm):
    """
    Formulário para a página "Add user" (Criar usuário)
    """
    class Meta(UserCreationForm.Meta):
        model = Usuario
        # Informa ao form para processar estes campos ADICIONAIS
        fields = UserCreationForm.Meta.fields + ('email', 'first_name', 'last_name', 'cargo')

    # --- ADICIONE ESTA FUNÇÃO ---
    def save(self, commit=True):
        """
        Salva o usuário com os campos customizados.
        """
        # 1. Chama o "save" original para criar o usuário com username e senha
        user = super().save(commit=False)

        # 2. Pega os dados extras do formulário limpo (cleaned_data)
        # Usamos .get para evitar KeyError caso algum campo não seja fornecido
        cd = getattr(self, 'cleaned_data', {})
        email = cd.get('email')
        first_name = cd.get('first_name')
        last_name = cd.get('last_name')
        cargo = cd.get('cargo')

        if email:
            user.email = email
        if first_name is not None:
            user.first_name = first_name
        if last_name is not None:
            user.last_name = last_name
        if cargo:
            user.cargo = cargo
        
        # 3. Salva o usuário no banco de dados
        if commit:
            user.save()
        return user
    # --- FIM DA FUNÇÃO ---


class CustomUserChangeForm(UserChangeForm):
    """
    Formulário para a página "Edit user" (Editar usuário)
    """
    class Meta:
        model = Usuario
        # Define quais campos aparecem na página de edição
        fields = ('username', 'email', 'first_name', 'last_name', 'cargo', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')

class CustomAuthenticationForm(AuthenticationForm):
    pass