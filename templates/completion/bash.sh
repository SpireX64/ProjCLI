__proj_cmdlist() {
  proj __complete commands 2>/dev/null | tr '\n' ' '
}
__proj_projects() {
  proj __complete projects 2>/dev/null | tr '\n' ' '
}
__proj_favs() {
  proj __complete fav-names 2>/dev/null | tr '\n' ' '
}
__proj_editors() {
  proj __complete editors 2>/dev/null | tr '\n' ' '
}
_proj() {
  local cur
  COMPREPLY=()
  cur="${COMP_WORDS[COMP_CWORD]}"
  if [ "${#COMP_WORDS[@]}" -eq 2 ]; then
    COMPREPLY=( $(compgen -W "$(__proj_cmdlist)" -- "$cur") )
    return
  fi
  case "${COMP_WORDS[1]}" in
    open)
      if [ "$COMP_CWORD" -eq 2 ]; then
        COMPREPLY=( $(compgen -W "$(__proj_projects)" -- "$cur") )
      elif [ "$COMP_CWORD" -eq 3 ]; then
        COMPREPLY=( $(compgen -W "$(__proj_editors)" -- "$cur") )
      fi
      ;;
    status|pwd|rm)
      if [ "$COMP_CWORD" -eq 2 ]; then
        COMPREPLY=( $(compgen -W "$(__proj_projects)" -- "$cur") )
      fi
      ;;
    set)
      if [ "$COMP_CWORD" -eq 2 ]; then
        COMPREPLY=( $(compgen -W "$(__proj_projects)" -- "$cur") )
      elif [ "$COMP_CWORD" -eq 3 ]; then
        COMPREPLY=( $(compgen -W "name owner created tracker editor" -- "$cur") )
      fi
      ;;
    get)
      if [ "$COMP_CWORD" -eq 2 ]; then
        COMPREPLY=( $(compgen -W "$(__proj_projects)" -- "$cur") )
      elif [ "$COMP_CWORD" -eq 3 ]; then
        COMPREPLY=( $(compgen -W "name owner created" -- "$cur") )
      fi
      ;;
    fav)
      if [ "$COMP_CWORD" -eq 2 ]; then
        COMPREPLY=( $(compgen -W "-d $(__proj_projects)" -- "$cur") )
      elif [ "$COMP_CWORD" -eq 3 ] && [ "${COMP_WORDS[2]}" = "-d" ]; then
        COMPREPLY=( $(compgen -W "$(__proj_favs)" -- "$cur") )
      fi
      ;;
    mv)
      if [ "$COMP_CWORD" -eq 2 ] || [ "$COMP_CWORD" -eq 3 ]; then
        COMPREPLY=( $(compgen -W "$(__proj_projects)" -- "$cur") )
      fi
      ;;
  esac
}
complete -F _proj proj
