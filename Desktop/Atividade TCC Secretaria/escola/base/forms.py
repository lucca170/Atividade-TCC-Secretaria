# Em: escola/base/forms.py
"""
Formulários customizados para autenticação e gerenciamento de usuários.
Estende os formulários padrão do Django para incluir campos personalizados.
"""

from django.contrib.auth.forms import UserCreationForm, UserChangeForm, AuthenticationForm
from .models import Usuario


# ========================
# FORMULÁRIO DE CRIAÇÃO DE USUÁRIO
# ========================
class CustomUserCreationForm(UserCreationForm):
    """
    Formulário customizado para criação de usuários.
    
    Herança: UserCreationForm (Django built-in)
    - UserCreationForm já inclui: username, password1, password2
    
    Adições:
    - email, first_name, last_name, cargo (campos do modelo Usuario)
    
    Uso:
    - Página "Add user" do Django admin
    - Endpoints de API para criação de usuários
    - Validação automática de senhas (igualdade, complexidade)
    """
    
    class Meta(UserCreationForm.Meta):
        """Metadados do formulário (configuração Django)"""
        model = Usuario  # Usa o modelo Usuario customizado
        # Define quais campos aparecem no formulário
        # UserCreationForm.Meta.fields traz: username, password1, password2
        # Adicionamos: email, first_name, last_name, cargo
        fields = UserCreationForm.Meta.fields + ('email', 'first_name', 'last_name', 'cargo')

    def save(self, commit=True):
        """
        Salva o usuário com os campos customizados.
        
        Args:
            commit (bool): Se True, salva no banco imediatamente. 
                          Se False, retorna o objeto não-persistido (útil para adicionar mais dados antes de salvar).
        
        Returns:
            Usuario: O objeto usuario criado.
            
        Notas:
            - Usa cleaned_data.get() para evitar KeyError se algum campo não for fornecido
            - Defensivo: verifica se cada campo existe antes de atribuir
        """
        # 1. Chama super().save(commit=False) para processar a criação com username e senha
        # commit=False faz o Django NÃO salvar no banco ainda (para adicionar mais dados primeiro)
        user = super().save(commit=False)

        # 2. Pega os dados do formulário validado (cleaned_data)
        # getattr(..., {}) = se cleaned_data não existe, usa um dict vazio
        cd = getattr(self, 'cleaned_data', {})
        
        # Extrai cada campo customizado usando .get() (retorna None se não encontrar)
        email = cd.get('email')
        first_name = cd.get('first_name')
        last_name = cd.get('last_name')
        cargo = cd.get('cargo')

        # Atribui os valores se existirem (evita sobrescrever com None)
        if email:
            user.email = email
        if first_name is not None:  # Permite string vazia, só não permite None
            user.first_name = first_name
        if last_name is not None:
            user.last_name = last_name
        if cargo:
            user.cargo = cargo
        
        # 3. Salva o usuário no banco de dados
        if commit:
            user.save()
        
        return user


# ========================
# FORMULÁRIO DE EDIÇÃO DE USUÁRIO
# ========================
class CustomUserChangeForm(UserChangeForm):
    """
    Formulário customizado para edição de usuários existentes.
    
    Herança: UserChangeForm (Django built-in)
    - Inclui campos para editar senha de forma segura (com hash)
    
    Uso:
    - Página "Edit user" do Django admin
    - Endpoints de API para modificar usuários
    """
    
    class Meta:
        """Metadados do formulário (configuração Django)"""
        model = Usuario  # Usa o modelo Usuario customizado
        # Define quais campos podem ser editados
        # Inclui: dados básicos, campos customizados, permissões
        fields = (
            'username',        # Nome de usuário (username)
            'email',           # Email (customizado, único)
            'first_name',      # Primeiro nome
            'last_name',       # Sobrenome
            'cargo',           # Cargo/papel (customizado)
            'is_active',       # Se o usuário pode fazer login
            'is_staff',        # Se o usuário pode acessar admin
            'is_superuser',    # Se o usuário é superuser (acesso total)
            'groups',          # Grupos de permissões (Django built-in)
            'user_permissions' # Permissões individuais (Django built-in)
        )


# ========================
# FORMULÁRIO DE AUTENTICAÇÃO
# ========================
class CustomAuthenticationForm(AuthenticationForm):
    """
    Formulário customizado para login de usuários.
    
    Herança: AuthenticationForm (Django built-in)
    - Validação padrão: username/email + password
    
    Uso:
    - Página de login
    - Endpoints de API para autenticação
    
    Nota: Este formulário está vazio porque herda todo comportamento de AuthenticationForm.
          Pode ser expandido para adicionar lógica customizada de autenticação.
    """
    pass